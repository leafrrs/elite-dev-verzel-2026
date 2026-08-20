import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { ticketService } from '../services/ticketService';
import type { TicketDetail } from '../types/ticket';
import { formatDate } from '../utils/formatters';
import { getTicketStatusLabel } from '../utils/ticketFormatters';
import './TicketDetails.scss';

export function TicketDetailsPage() {
  const { ticketCode } = useParams<{ ticketCode: string }>();
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    async function loadTicket() {
      if (!ticketCode) return;
      try {
        const data = await ticketService.listMyTickets();
        const found = data.find(t => t.ticketCode === ticketCode);
        
        if (found) {
          setTicket(found);
          setStatus('success');
        } else {
          setStatus('error');
        }
      } catch (err) {
        setStatus('error');
      }
    }
    loadTicket();
  }, [ticketCode]);

  if (status === 'loading') {
    return <div className="container state-message"><p>Carregando ingresso...</p></div>;
  }

  if (status === 'error' || !ticket) {
    return (
      <div className="container state-message state-message--error">
        <p>Ingresso não encontrado ou você não tem permissão para acessá-lo.</p>
        <Link to="/tickets" className="btn-secondary" style={{ marginTop: '16px', display: 'inline-block' }}>Voltar para Meus Ingressos</Link>
      </div>
    );
  }

  const qrPayload = JSON.stringify({
    ticketCode: ticket.ticketCode,
    secureHash: ticket.secureHash,
    eventId: ticket.eventId
  });

  return (
    <div className="container ticket-details-page">
      <div className="ticket-view">
        <header className="ticket-view__header">
          <h2>{ticket.event.title}</h2>
          <span className={`ticket-badge ticket-badge--${ticket.status.toLowerCase()}`}>
            {getTicketStatusLabel(ticket.status)}
          </span>
        </header>

        <div className="ticket-view__qr-section">
          {ticket.status === 'VALID' ? (
            <div className="qr-wrapper" aria-label={`QR Code para validação do ingresso ${ticket.ticketCode}`}>
              <QRCodeSVG 
                value={qrPayload} 
                size={220} 
                level="Q" 
                includeMargin={false} 
                bgColor="#ffffff" 
                fgColor="#000000" 
              />
            </div>
          ) : (
            <div className="qr-wrapper qr-wrapper--disabled" aria-label="QR Code indisponível">
              <p>QR Code indisponível: {getTicketStatusLabel(ticket.status).toLowerCase()}</p>
            </div>
          )}
          <p className="ticket-view__code-text" aria-label="Código de verificação manual">{ticket.ticketCode}</p>
        </div>

        <div className="ticket-view__info">
          <div className="info-group">
            <span className="label">Data</span>
            <span className="value">{formatDate(ticket.event.date)}</span>
          </div>
          <div className="info-group">
            <span className="label">Local</span>
            <span className="value">{ticket.event.location}</span>
          </div>
          {ticket.seat && (
            <div className="info-group">
              <span className="label">Cadeira</span>
              <span className="value">{ticket.seat.seatCode}</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="ticket-details-page__actions">
        <Link to="/tickets" className="btn-secondary">Voltar para Meus Ingressos</Link>
      </div>
    </div>
  );
}
