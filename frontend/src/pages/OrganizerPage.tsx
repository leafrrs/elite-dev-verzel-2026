import { useState, useRef } from 'react';
import type { FormEvent } from 'react';
import { tmdbService } from '../services/tmdbService';
import { eventService } from '../services/eventService';
import type { ExternalEventDetails } from '../types/tmdb';
import type { EventType } from '../types/event';
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
    </div>
  );
}
