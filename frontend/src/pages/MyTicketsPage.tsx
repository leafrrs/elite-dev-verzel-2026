import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ticketService } from '../services/ticketService';
import type { TicketDetail } from '../types/ticket';
import { formatDate } from '../utils/formatters';
import { getTicketStatusLabel } from '../utils/ticketFormatters';
import './MyTickets.scss';

export function MyTicketsPage() {
  const [tickets, setTickets] = useState<TicketDetail[]>([]);
  const [status, setStatus] = useState<'loading' | 'success' | 'empty' | 'error'>('loading');

  useEffect(() => {
    async function loadTickets() {
      try {
        const data = await ticketService.listMyTickets();
        if (data.length === 0) {
          setStatus('empty');
        } else {
          setTickets(data);
          setStatus('success');
        }
      } catch (error) {
        setStatus('error');
      }
    }
    loadTickets();
  }, []);

  if (status === 'loading') {
    return <div className="container state-message"><p>Buscando seus ingressos...</p></div>;
  }

  if (status === 'error') {
    return <div className="container state-message state-message--error"><p>Erro ao buscar seus ingressos.</p></div>;
  }

  if (status === 'empty') {
    return (
      <div className="container state-message">
        <p>Você ainda não possui ingressos.</p>
        <Link to="/" className="btn-primary" style={{ display: 'inline-block', marginTop: '16px' }}>Explorar Eventos</Link>
      </div>
    );
  }

  return (
    <div className="container my-tickets">
      <header className="my-tickets__header">
        <h1>Meus Ingressos</h1>
        <p>Acesse seus ingressos ativos e históricos de eventos.</p>
      </header>

      <div className="tickets-grid">
        {tickets.map(ticket => (
          <Link key={ticket.id} to={`/tickets/${ticket.ticketCode}`} className={`ticket-card ticket-card--${ticket.status.toLowerCase()}`}>
            <div className="ticket-card__header">
              <h3>{ticket.event.title}</h3>
              <span className="ticket-card__status">{getTicketStatusLabel(ticket.status)}</span>
            </div>
            
            <div className="ticket-card__body">
              <p><strong>Data:</strong> {formatDate(ticket.event.date)}</p>
              <p><strong>Local:</strong> {ticket.event.location}</p>
              {ticket.seat && <p><strong>Cadeira:</strong> {ticket.seat.seatCode}</p>}
            </div>

            <div className="ticket-card__footer">
              <span className="ticket-card__code">{ticket.ticketCode}</span>
              <span className="btn-secondary">Exibir QR Code</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
