import { useEffect, useState } from 'react';
import { eventService } from '../services/eventService';
import type { EventModel } from '../types/event';
import { EventCard } from '../components/EventCard/EventCard';
import './Home.scss';

export function HomePage() {
  const [events, setEvents] = useState<EventModel[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error' | 'empty'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
  }, []); // Array vazio = Roda apenas 1 vez ao montar a página

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
        <section className="events-grid">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </section>
      )}
    </div>
  );
}
