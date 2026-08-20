import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { ticketService } from '../services/ticketService';
import type { SharedTicket } from '../types/ticket';
import { formatDate } from '../utils/formatters';
import { getTicketStatusLabel } from '../utils/ticketFormatters';
import './TicketDetails.scss';

export function SharedTicketPage() {
  const { shareToken } = useParams<{ shareToken: string }>();
  const [ticket, setTicket] = useState<SharedTicket | null>(null);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    async function loadSharedTicket() {
      if (!shareToken) return;
      try {
        const data = await ticketService.getSharedTicket(shareToken);
        setTicket(data);
        setStatus('success');
      } catch (err: any) {
        setStatus('error');
        setErrorMsg(err.data?.error || 'Não foi possível carregar o ingresso compartilhado.');
      }
    }
    loadSharedTicket();
  }, [shareToken]);

  if (status === 'loading') {
    return <div className="container state-message"><p>Carregando ingresso compartilhado...</p></div>;
  }

  if (status === 'error' || !ticket) {
    return (
      <div className="container state-message state-message--error">
        <p>{errorMsg || 'Ingresso compartilhado inválido ou indisponível.'}</p>
        <Link to="/" className="btn-secondary" style={{ marginTop: '16px', display: 'inline-block' }}>Ir para Home</Link>
      </div>
    );
  }

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
                value={ticket.qrPayload} 
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
        <p style={{ color: '#A0A0A0', fontSize: '0.9rem', marginBottom: '16px' }}>
          Este é um ingresso compartilhado com você.
        </p>
        <Link to="/" className="btn-secondary">Explorar Eventos da Plataforma</Link>
      </div>
    </div>
  );
}
