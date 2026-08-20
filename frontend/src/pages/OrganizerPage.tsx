import { useState, useRef, useEffect } from 'react';
import type { FormEvent } from 'react';
import { tmdbService } from '../services/tmdbService';
import { eventService } from '../services/eventService';
import type { ExternalEventDetails } from '../types/tmdb';
import type { EventType, EventModel, UpdateEventPayload } from '../types/event';
import './OrganizerPage.scss';

export function OrganizerPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ExternalEventDetails[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<ExternalEventDetails | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const previewRef = useRef<HTMLDivElement>(null);

  // Estados de criação do evento
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdEventId, setCreatedEventId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    date: '',
    location: '',
    price: '',
    totalCapacity: '',
    type: 'GENERAL_ADMISSION' as EventType
  });

  const [formError, setFormError] = useState('');

  // Estados de listagem de eventos criados
  const [myEvents, setMyEvents] = useState<EventModel[]>([]);
  const [isLoadingMyEvents, setIsLoadingMyEvents] = useState(false);
  const [myEventsError, setMyEventsError] = useState('');

  // Estados de edição de evento
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editFormError, setEditFormError] = useState('');
  const [editFormData, setEditFormData] = useState<UpdateEventPayload>({});

  async function fetchMyEvents() {
    setIsLoadingMyEvents(true);
    setMyEventsError('');
    try {
      const data = await eventService.getMyEvents();
      setMyEvents(data);
    } catch (err: any) {
      console.error(err);
      setMyEventsError('Não foi possível carregar seus eventos.');
    } finally {
      setIsLoadingMyEvents(false);
    }
  }

  function startEditing(event: EventModel) {
    setEditingEventId(event.id);
    setEditFormError('');
    setEditFormData({
      title: event.title,
      description: event.description,
      date: new Date(event.date).toISOString().slice(0, 16),
      location: event.location,
      price: event.price
    });
  }

  async function handleEditSubmit(e: FormEvent, eventId: string) {
    e.preventDefault();
    if (isSavingEdit) return;

    if (editFormData.price && Number(editFormData.price) <= 0) {
      setEditFormError('O preço deve ser maior que zero.');
      return;
    }
    if (editFormData.date && new Date(editFormData.date) <= new Date()) {
      setEditFormError('A data do evento deve estar no futuro.');
      return;
    }

    setIsSavingEdit(true);
    setEditFormError('');

    try {
      // Converte a string date de formato HTML local (YYYY-MM-DDThh:mm) para Date string e price para Number
      const payload: UpdateEventPayload = {
        title: editFormData.title,
        description: editFormData.description,
        location: editFormData.location,
      };

      if (editFormData.date) payload.date = new Date(editFormData.date).toISOString();
      if (editFormData.price) payload.price = Number(editFormData.price);

      await eventService.updateEvent(eventId, payload);
      setEditingEventId(null);
      fetchMyEvents(); // Refresh da lista
    } catch (err: any) {
      console.error(err);
      setEditFormError(err.data?.error || 'Erro inesperado ao salvar alterações.');
    } finally {
      setIsSavingEdit(false);
    }
  }

  useEffect(() => {
    fetchMyEvents();
  }, []);

  async function handleSearch(e: FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setError('');
    setHasSearched(true);
    setSelectedMovie(null);
    setIsConfiguring(false);
    setCreatedEventId(null);
    setFormError('');

    try {
      const data = await tmdbService.searchMovies(query);
      setResults(data);
    } catch (err: any) {
      console.error(err);
      const msg = err.data?.error || 'Não foi possível buscar filmes no momento.';
      setError(msg);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleSelect(movie: ExternalEventDetails) {
    setSelectedMovie(movie);
    setIsConfiguring(false);
    setCreatedEventId(null);
    setFormError('');
    
    setTimeout(() => {
      previewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }

  async function handleCreateEvent(e: FormEvent) {
    e.preventDefault();
    if (!selectedMovie || isSubmitting) return;

    setFormError('');
    
    // Validação de frontend
    if (!formData.date) return setFormError('A data é obrigatória.');
    if (!formData.location.trim()) return setFormError('A localização é obrigatória.');
    
    const priceNum = parseFloat(formData.price);
    const capacityNum = parseInt(formData.totalCapacity, 10);
    
    if (isNaN(priceNum) || priceNum <= 0) return setFormError('O preço deve ser maior que zero.');
    if (isNaN(capacityNum) || capacityNum <= 0) return setFormError('A capacidade deve ser maior que zero.');

    const eventDate = new Date(formData.date);
    if (eventDate <= new Date()) {
      return setFormError('A data do evento deve ser no futuro.');
    }

    setIsSubmitting(true);

    try {
      const payload = {
        title: selectedMovie.title,
        description: selectedMovie.description,
        bannerUrl: selectedMovie.posterUrl || undefined,
        externalId: selectedMovie.externalId,
        externalSource: selectedMovie.source,
        date: eventDate.toISOString(),
        location: formData.location.trim(),
        price: priceNum,
        totalCapacity: capacityNum,
        type: formData.type
      };

      const newEvent = await eventService.createEvent(payload);
      setCreatedEventId(newEvent.id);
      setIsConfiguring(false);
      // Atualiza a listagem de eventos sem precisar de F5
      fetchMyEvents();
    } catch (err: any) {
      console.error(err);
      const msg = err.data?.error || 'Erro inesperado ao criar o evento.';
      setFormError(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="container organizer-page">
      <header className="organizer-page__header">
        <h1>Painel do Organizador</h1>
        <p>Busque filmes na base da TMDb para importá-los como novos eventos na plataforma.</p>
      </header>

      <form onSubmit={handleSearch} className="organizer-page__search">
        <input 
          type="text" 
          placeholder="Ex: Matrix, Avatar, O Poderoso Chefão..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={isLoading || isSubmitting}
        />
        <button type="submit" className="btn-primary" disabled={isLoading || isSubmitting || !query.trim()}>
          {isLoading ? 'Buscando...' : 'Pesquisar'}
        </button>
      </form>

      {error && (
        <div className="organizer-page__status organizer-page__status--error" aria-live="assertive">
          {error}
        </div>
      )}

      {isLoading && (
        <div className="organizer-page__status" aria-live="polite">
          Consultando banco de dados externo...
        </div>
      )}

      {!isLoading && !error && hasSearched && results.length === 0 && (
        <div className="organizer-page__status">
          Nenhum filme encontrado para "{query}". Tente outro termo.
        </div>
      )}

      {!isLoading && results.length > 0 && !createdEventId && (
        <div className="organizer-page__grid">
          {results.map((movie) => (
            <button 
              type="button"
              key={movie.externalId} 
              className={`organizer-page__card ${selectedMovie?.externalId === movie.externalId ? 'organizer-page__card--active' : ''}`}
              onClick={() => handleSelect(movie)}
              aria-label={`Selecionar filme ${movie.title}`}
              disabled={isSubmitting}
            >
              <img 
                src={movie.posterUrl || 'https://via.placeholder.com/300x450?text=Sem+Poster'} 
                alt={`Poster de ${movie.title}`} 
                loading="lazy"
              />
              <div className="info">
                <h3>{movie.title}</h3>
                <span>
                  {movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : 'Data não informada'}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {selectedMovie && !isConfiguring && !createdEventId && (
        <section className="organizer-page__preview" ref={previewRef} aria-live="polite">
          <img 
            src={selectedMovie.posterUrl || 'https://via.placeholder.com/300x450?text=Sem+Poster'} 
            alt={`Poster expandido de ${selectedMovie.title}`} 
          />
          <div className="details">
            <h2>{selectedMovie.title}</h2>
            <div className="meta">
              Lançamento: {selectedMovie.releaseDate ? new Date(selectedMovie.releaseDate).toLocaleDateString('pt-BR') : 'Desconhecido'}
              {' '} | ID TMDb: {selectedMovie.externalId}
            </div>
            <p>{selectedMovie.description}</p>
            
            <div className="actions">
              <button 
                type="button" 
                className="btn-primary" 
                onClick={() => setIsConfiguring(true)}
              >
                Continuar com este filme
              </button>
            </div>
          </div>
        </section>
      )}

      {isConfiguring && !createdEventId && (
        <section className="organizer-page__config" aria-live="polite">
          <h2>Configurar Evento: {selectedMovie?.title}</h2>
          
          <form onSubmit={handleCreateEvent} className="organizer-page__form">
            <div className="form-group">
              <label htmlFor="eventDate">Data e Hora do Evento</label>
              <input 
                type="datetime-local" 
                id="eventDate"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                disabled={isSubmitting}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="eventLocation">Local (Sala/Cinema)</label>
              <input 
                type="text" 
                id="eventLocation"
                placeholder="Ex: Sala IMAX 3, Shopping Central"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="eventPrice">Preço (R$)</label>
              <input 
                type="number" 
                id="eventPrice"
                min="0.01"
                step="0.01"
                placeholder="Ex: 45.00"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="eventCapacity">Capacidade de Assentos</label>
              <input 
                type="number" 
                id="eventCapacity"
                min="1"
                step="1"
                placeholder="Ex: 150"
                value={formData.totalCapacity}
                onChange={(e) => setFormData(prev => ({ ...prev, totalCapacity: e.target.value }))}
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="eventType">Tipo de Assento</label>
              <select 
                id="eventType"
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as EventType }))}
                disabled={isSubmitting}
              >
                <option value="GENERAL_ADMISSION">Geral (Livre)</option>
                <option value="SEATED">Lugar Marcado (Numerado)</option>
              </select>
            </div>

            {formError && (
              <div className="error-message">
                {formError}
              </div>
            )}

            <div className="actions">
              <button type="button" className="btn-secondary" onClick={() => setIsConfiguring(false)} disabled={isSubmitting}>
                Cancelar
              </button>
              <button type="submit" className="btn-primary" disabled={isSubmitting}>
                {isSubmitting ? 'Publicando...' : 'Publicar Evento'}
              </button>
            </div>
          </form>
        </section>
      )}

      {createdEventId && (
        <div className="organizer-page__status organizer-page__status--success">
          <h2>Sucesso!</h2>
          <p>O evento "{selectedMovie?.title}" foi publicado na plataforma.</p>
          <p>ID do Evento: <strong>{createdEventId}</strong></p>
          <button type="button" className="btn-secondary" onClick={() => {
            setQuery('');
            setResults([]);
            setSelectedMovie(null);
            setCreatedEventId(null);
            setHasSearched(false);
          }}>
            Importar outro filme
          </button>
        </div>
      )}

      {/* Seção: Meus Eventos */}
      <section className="organizer-page__my-events">
        <h2>Meus Eventos Publicados</h2>
        
        {isLoadingMyEvents && (
          <div className="organizer-page__status">
            Carregando seus eventos...
          </div>
        )}

        {myEventsError && (
          <div className="organizer-page__status organizer-page__status--error">
            {myEventsError}
          </div>
        )}

        {!isLoadingMyEvents && !myEventsError && myEvents.length === 0 && (
          <div className="organizer-page__status">
            Você ainda não publicou nenhum evento. Use a busca acima para começar!
          </div>
        )}

        {!isLoadingMyEvents && myEvents.length > 0 && (
          <div className="organizer-page__list">
            {myEvents.map(event => (
              <div key={event.id} className="organizer-page__list-item">
                <img 
                  src={event.bannerUrl || 'https://via.placeholder.com/150x225?text=Sem+Poster'} 
                  alt={event.title}
                  loading="lazy"
                />
                <div className="info">
                  {editingEventId === event.id ? (
                    <form className="organizer-page__edit-form" onSubmit={(e) => handleEditSubmit(e, event.id)}>
                      <div className="form-group">
                        <label>Título do Evento</label>
                        <input 
                          type="text" 
                          required 
                          value={editFormData.title || ''} 
                          onChange={e => setEditFormData({...editFormData, title: e.target.value})}
                          disabled={isSavingEdit}
                        />
                      </div>
                      <div className="form-group">
                        <label>Data e Hora</label>
                        <input 
                          type="datetime-local" 
                          required 
                          value={editFormData.date || ''} 
                          onChange={e => setEditFormData({...editFormData, date: e.target.value})}
                          disabled={isSavingEdit}
                        />
                      </div>
                      <div className="form-group">
                        <label>Localização</label>
                        <input 
                          type="text" 
                          required 
                          value={editFormData.location || ''} 
                          onChange={e => setEditFormData({...editFormData, location: e.target.value})}
                          disabled={isSavingEdit}
                        />
                      </div>
                      <div className="form-group">
                        <label>Preço (R$)</label>
                        <input 
                          type="number" 
                          step="0.01" 
                          min="0.01" 
                          required 
                          value={editFormData.price || ''} 
                          onChange={e => setEditFormData({...editFormData, price: Number(e.target.value)})}
                          disabled={isSavingEdit}
                        />
                      </div>
                      
                      {editFormError && <p className="error-message">{editFormError}</p>}
                      
                      <div className="actions">
                        <button type="submit" disabled={isSavingEdit}>
                          {isSavingEdit ? 'Salvando...' : 'Salvar'}
                        </button>
                        <button type="button" className="btn-secondary" onClick={() => setEditingEventId(null)} disabled={isSavingEdit}>
                          Cancelar
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <h3>{event.title}</h3>
                      <div className="meta">
                        Data: {new Date(event.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} <br/>
                        Local: {event.location} <br/>
                        Tipo: {event.type === 'SEATED' ? 'Lugar Marcado' : 'Entrada Geral'} <br/>
                        Capacidade: {event.totalCapacity} (Disponível: {event.availableStock}) <br/>
                        Preço: R$ {event.price.toFixed(2)}
                      </div>
                      <div className="actions">
                        <button 
                          type="button" 
                          className="btn-secondary"
                          onClick={() => window.open(`/events/${event.id}`, '_blank')}
                          title="Ver página pública do evento"
                        >
                          Ver Página Pública
                        </button>
                        <button 
                          type="button" 
                          onClick={() => startEditing(event)}
                        >
                          Editar Dados
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

    </div>
  );
}
