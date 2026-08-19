import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eventService } from '../services/eventService';
import { reservationService } from '../services/reservationService';
import { Seat } from '../components/Seat/Seat';
import type { EventDetails } from '../types/event';
import { formatCurrency, formatDate } from '../utils/formatters';
import './Reservation.scss';

export function ReservationPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [event, setEvent] = useState<EventDetails | null>(null);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Estados temporários da interface
  const [selectedSeatCode, setSelectedSeatCode] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Extraímos o loadEvent para fora do useEffect para podermos chamá-lo em caso de conflito
  async function loadEvent() {
    if (!id) return;
    try {
      const data = await eventService.getEventById(id);
      setEvent(data);
      setStatus('success');
    } catch (err: any) {
      setStatus('error');
      setErrorMsg('Não foi possível carregar os detalhes do evento para reserva.');
    }
  }

  useEffect(() => {
    loadEvent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (status === 'loading') {
    return <div className="container state-message"><p>Carregando dados da reserva...</p></div>;
  }

  if (status === 'error' || !event) {
    return <div className="container state-message state-message--error"><p>{errorMsg}</p></div>;
  }

  // Lógica da UI
  const isSeated = event.type === 'SEATED';
  const availableStock = event.availableStock;
  
  // Habilita se for pista com estoque OU se for cadeira e tiver selecionado uma
  const canSubmit = isSeated ? !!selectedSeatCode : availableStock > 0;

  async function handleReserve() {
    if (!canSubmit) return;
    
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const reservation = await reservationService.createReservation({
        eventId: event!.id,
        seatCode: isSeated ? selectedSeatCode! : undefined,
      });

      // Sucesso! Vai pro checkout (placeholder)
      navigate(`/checkout/${reservation.id}`);

    } catch (err: any) {
      if (err.status === 409) {
        // Conflito! Outro usuário comprou na nossa frente
        setErrorMsg('Este ingresso acabou de ser reservado por outra pessoa. Escolha outra opção.');
        setSelectedSeatCode(null); // Reseta a seleção visual
        await loadEvent(); // Atualiza os dados reais do mapa direto do banco
      } else if (err.status === 401 || err.status === 403) {
        setErrorMsg('Sessão expirada ou sem permissão. Faça login como Cliente.');
      } else {
        setErrorMsg(err.data?.error || 'Ocorreu um erro ao processar a reserva. Tente novamente.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="container reservation-page">
      <header className="reservation-page__header">
        <h1>Reserva de Ingresso</h1>
        <p>Revise os detalhes e confirme sua reserva.</p>
      </header>

      <div className="reservation-page__content">
        
        {/* Detalhes simples do evento */}
        <section className="reservation-summary">
          <h2>{event.title}</h2>
          <p><strong>Data:</strong> {formatDate(event.date)}</p>
          <p><strong>Local:</strong> {event.location}</p>
          <p className="reservation-summary__price">{formatCurrency(event.price)}</p>
        </section>

        {/* Escolha do ingresso */}
        <section className="reservation-selection">
          {isSeated ? (
            <div className="seat-map-section">
              <h3>Selecione seu Assento</h3>
              <div className="seat-map-grid">
                {event.seats.map((seat) => (
                  <Seat 
                    key={seat.id}
                    seat={seat}
                    selected={selectedSeatCode === seat.seatCode}
                    onSelect={setSelectedSeatCode}
                  />
                ))}
              </div>
              <p className="seat-map-hint">
                <span className="hint-box hint-box--available"></span> Disponível
                <span className="hint-box hint-box--reserved"></span> Reservado
                <span className="hint-box hint-box--sold"></span> Vendido
              </p>
            </div>
          ) : (
            <div className="general-admission-section">
              <h3>Ingresso Pista Livre</h3>
              {availableStock > 0 ? (
                <p className="stock-info">Estoque disponível: {availableStock}</p>
              ) : (
                <p className="stock-info stock-info--empty">Ingressos esgotados!</p>
              )}
            </div>
          )}
        </section>

        {/* Áudio/Feedback visual de erro */}
        {errorMsg && (
          <div className="error-message">
            <p>{errorMsg}</p>
          </div>
        )}

        {/* Submissão */}
        <div className="reservation-action">
          <button 
            className="btn-primary"
            disabled={!canSubmit || isSubmitting}
            onClick={handleReserve}
          >
            {isSubmitting ? 'Processando...' : 'Confirmar Reserva'}
          </button>
        </div>

      </div>
    </div>
  );
}
