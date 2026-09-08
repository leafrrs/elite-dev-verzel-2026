import { useEffect, useState } from 'react';
import { eventService } from '../services/eventService';
import type { EventModel } from '../types/event';
import { EventCard } from '../components/EventCard/EventCard';
import './Home.scss';

export function HomePage() {
  const [events, setEvents] = useState<EventModel[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error' | 'empty'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Novos estados para a Busca e Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'SEATED' | 'GENERAL_ADMISSION'>('ALL');

  useEffect(() => {
    async function loadEvents() {
      setStatus('loading');
      try {
        const data = await eventService.getEvents();
        if (data.length === 0) {
          setStatus('empty');
        } else {
          setEvents(data);
          setStatus('success');
        }
      } catch (err) {
        setStatus('error');
        setErrorMsg('Não foi possível carregar os eventos. Verifique sua conexão.');
      }
    }

    loadEvents();
  }, []);

  // Lista Derivada: Filtra em tempo de renderização
  const filteredEvents = events.filter((event) => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'ALL' || event.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="container home-page">
      <header className="home-page__header">
        <h1>Catálogo de Eventos</h1>
        <p>Explore as melhores experiências e garanta seu lugar.</p>
      </header>

      {status === 'loading' && (
        <div className="state-message">
          <p>Carregando eventos...</p>
        </div>
      )}

      {status === 'error' && (
        <div className="state-message state-message--error">
          <p>{errorMsg}</p>
        </div>
      )}

      {status === 'empty' && (
        <div className="state-message">
          <p>Nenhum evento publicado no momento.</p>
        </div>
      )}

      {status === 'success' && (
        <>
          <div className="catalog-controls">
            <div className="search-wrapper">
              <span className="search-icon" aria-hidden="true">🔍</span>
              <input
                type="text"
                placeholder="Buscar eventos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            
            <div className="filter-pills">
              <button
                className={`filter-pill ${filterType === 'ALL' ? 'active' : ''}`}
                onClick={() => setFilterType('ALL')}
              >
                Todos
              </button>
              <button
                className={`filter-pill ${filterType === 'SEATED' ? 'active' : ''}`}
                onClick={() => setFilterType('SEATED')}
              >
                Cadeiras
              </button>
              <button
                className={`filter-pill ${filterType === 'GENERAL_ADMISSION' ? 'active' : ''}`}
                onClick={() => setFilterType('GENERAL_ADMISSION')}
              >
                Pista
              </button>
            </div>
          </div>

          {filteredEvents.length === 0 ? (
            <div className="state-message">
              <p>Nenhum evento encontrado para a sua busca.</p>
            </div>
          ) : (
            <section className="events-grid">
              {filteredEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </section>
          )}
        </>
      )}
    </div>
  );
}
