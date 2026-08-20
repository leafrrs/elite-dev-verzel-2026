import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { reservationService } from '../services/reservationService';
import type { Ticket } from '../types/reservation';
import './Checkout.scss';

export function CheckoutPage() {
  const { reservationId } = useParams<{ reservationId: string }>();

  const [status, setStatus] = useState<'idle' | 'processing' | 'success_approved' | 'success_refused' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [ticket, setTicket] = useState<Ticket | null>(null);

  if (!reservationId) {
    return <div className="container state-message"><p>Reserva inválida.</p></div>;
  }

  async function handlePayment(approved: boolean) {
    setStatus('processing');
    setErrorMsg(null);

    try {
      const response = await reservationService.processPayment(reservationId!, approved);
      
      if (approved && response.ticket) {
        setTicket(response.ticket);
        setStatus('success_approved');
      } else {
        setStatus('success_refused');
      }
    } catch (err: any) {
      setStatus('error');
      if (err.status === 403) {
        setErrorMsg('Você não tem permissão para pagar esta reserva.');
      } else if (err.status === 404) {
        setErrorMsg('Reserva não encontrada.');
      } else if (err.status === 409) {
        setErrorMsg('Esta reserva já foi processada ou houve um conflito de estado.');
      } else if (err.status === 400) {
        setErrorMsg('Formato de reserva inválido.');
      } else {
        setErrorMsg('Ocorreu um erro ao processar o pagamento. Tente novamente.');
      }
    }
  }

  return (
    <div className="container checkout-page">
      <header className="checkout-page__header">
        <h1>Checkout Simulado</h1>
        <p>Apenas para fins de avaliação. Escolha o resultado da transação.</p>
      </header>

      <div className="checkout-page__content">
        <section className="checkout-summary">
          <h2>Detalhes da Reserva</h2>
          <p>
            ID da Reserva: <br />
            <strong>{reservationId}</strong>
          </p>
          <div className="checkout-alert">
            <p>
              ⚠️ <strong>Limitação Técnica Atual:</strong> Como o Backend ainda não possui a rota <code>GET /reservations/:id</code>, não podemos buscar e exibir o valor exato, nome do evento ou cadeira diretamente nesta tela após um F5 de forma segura e confiável (sem depender de state de rota).
            </p>
          </div>
        </section>

        {status === 'error' && (
          <div className="error-message">
            <p>{errorMsg}</p>
          </div>
        )}

        {status === 'success_approved' && (
          <div className="success-message">
            <h2>Pagamento Aprovado! 🎉</h2>
            <p>Sua transação foi confirmada e o assento/ingresso foi garantido.</p>
            {ticket && (
              <div className="ticket-preview">
                <p><strong>Código do Ingresso:</strong> {ticket.ticketCode}</p>
              </div>
            )}
            <button className="btn-primary" onClick={() => alert('Visualização do Ticket completo na Fase F8')}>
              Ver ingresso completo
            </button>
          </div>
        )}

        {status === 'success_refused' && (
          <div className="refused-message">
            <h2>Pagamento Recusado ❌</h2>
            <p>A transação não foi aprovada. A reserva foi cancelada e o assento foi liberado para o público.</p>
            <Link to="/" className="btn-secondary">Voltar aos Eventos</Link>
          </div>
        )}

        {(status === 'idle' || status === 'processing' || status === 'error') && (
          <section className="checkout-actions">
            <h3>Simular Transação PIX / Cartão</h3>
            <div className="checkout-actions__buttons">
              <button 
                className="btn-success" 
                disabled={status === 'processing'}
                onClick={() => handlePayment(true)}
              >
                {status === 'processing' ? 'Processando...' : 'Simular Aprovação'}
              </button>
              
              <button 
                className="btn-danger" 
                disabled={status === 'processing'}
                onClick={() => handlePayment(false)}
              >
                Simular Recusa
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
