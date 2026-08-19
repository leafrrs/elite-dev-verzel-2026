import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eventService } from '../services/eventService';
import { useAuth } from '../contexts/AuthContext';
import type { EventDetails } from '../types/event';
import { formatCurrency, formatDate } from '../utils/formatters';
import './EventDetails.scss';

export function EventDetailsPage() {
  const { id } = useParams<{ id: string }>(); // Puxa o ID da URL
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const [event, setEvent] = useState<EventDetails | null>(null);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    // Se a tipagem falhar e não houver ID (ex: rotas mal configuradas)
    if (!id) return;

    async function loadEvent() {
      try {
        const data = await eventService.getEventById(id as string);
        setEvent(data);
        setStatus('success');
      } catch (err: any) {
        setStatus('error');
        if (err.status === 404) {
          setErrorMsg('Evento não encontrado.');
        } else if (err.status === 400) {
          setErrorMsg('URL do evento inválida.');
        } else {
          setErrorMsg('Não foi possível carregar os detalhes do evento.');
        }
      }
    }

    loadEvent();
  }, [id]);

  if (status === 'loading') {
    return <div className="container state-message"><p>Buscando detalhes...</p></div>;
  }

  if (status === 'error' || !event) {
    return <div className="container state-message state-message--error"><p>{errorMsg}</p></div>;
  }

  // Tratamento de disponibilidade dependendo do tipo de evento
  const availableCount = event.type === 'SEATED' 
    ? event.seats.filter(s => s.status === 'AVAILABLE').length 
    : event.availableStock;

  const fallback = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%221200%22%20height%3D%22400%22%20viewBox%3D%220%200%201200%20400%22%3E%3Crect%20width%3D%221200%22%20height%3D%22400%22%20fill%3D%22%232A2A2A%22%2F%3E%3Ctext%20x%3D%22600%22%20y%3D%22200%22%20fill%3D%22%23555555%22%20font-family%3D%22sans-serif%22%20font-size%3D%2224%22%20text-anchor%3D%22middle%22%20alignment-baseline%3D%22middle%22%3ESem%20imagem%3C%2Ftext%3E%3C%2Fsvg%3E';

  function handleReservationClick() {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    navigate(`/events/${event!.id}/reserve`);
  }

  return (
    <div className="container event-details">
      <div className="event-details__banner">
        <img src={event.bannerUrl || fallback} alt={`Banner de ${event.title}`} />
      </div>

      <div className="event-details__main">
        <div className="event-details__info">
          <h1>{event.title}</h1>
          <p className="event-details__description">{event.description}</p>
          
          <div className="event-details__metadata">
            <p><strong>Data:</strong> {formatDate(event.date)}</p>
            <p><strong>Local:</strong> {event.location}</p>
            <p><strong>Formato:</strong> {event.type === 'SEATED' ? 'Evento com assentos marcados' : 'Pista Livre (General Admission)'}</p>
            <p><strong>Disponibilidade:</strong> {availableCount} ingressos disponíveis</p>
          </div>
        </div>

        <aside className="event-details__sidebar">
          <div className="checkout-card">
            <span className="checkout-card__price">{formatCurrency(event.price)}</span>
            
            {/* Somente exibe botão ativo se não estiver logado ou se for CLIENT */}
            {(!isAuthenticated || user?.role === 'CLIENT') ? (
               <button 
                className="btn-primary" 
                onClick={handleReservationClick}
                disabled={availableCount === 0}
               >
                 {availableCount === 0 ? 'Esgotado' : 'Reservar Ingresso'}
               </button>
            ) : (
               <button className="btn-primary" disabled>
                 Apenas Clientes podem comprar
               </button>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
