import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { eventService } from '../services/eventService';
import { ticketService } from '../services/ticketService';
import type { EventModel } from '../types/event';
import './GatePage.scss';

type ValidationState = 'idle' | 'processing' | 'success' | 'error_invalid' | 'error_used' | 'error_wrong_event';

export function GatePage() {
  const [events, setEvents] = useState<EventModel[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  
  const [ticketCode, setTicketCode] = useState('');
  const [secureHash, setSecureHash] = useState('');
  
  const [status, setStatus] = useState<ValidationState>('idle');
  const [feedbackMsg, setFeedbackMsg] = useState('');

  // 1. Carrega eventos para a seleção de contexto da Portaria
  useEffect(() => {
    async function loadEvents() {
      try {
        const data = await eventService.getEvents();
        setEvents(data);
        if (data.length > 0) {
          setSelectedEventId(data[0].id);
        }
      } catch (err) {
        console.error('Erro ao buscar eventos na portaria', err);
      }
    }
    loadEvents();
  }, []);

  // 2. Validação Manual
  async function handleValidate(e: FormEvent) {
    e.preventDefault();
    if (!selectedEventId || !ticketCode || !secureHash) return;

    setStatus('processing');
    setFeedbackMsg('Processando...');

    try {
      const response = await ticketService.validateTicket({
        ticketCode,
        secureHash,
        eventId: selectedEventId
      });
      
      setStatus('success');
      setFeedbackMsg(response.message || 'INGRESSO VÁLIDO');
      
      // Limpa para a próxima leitura
      setTicketCode('');
      setSecureHash('');
      
    } catch (err: any) {
      const statusHttp = err.status;
      const dataMsg = err.data?.error || 'Erro desconhecido';

      if (statusHttp === 409) {
        setStatus('error_used');
        setFeedbackMsg('INGRESSO JÁ UTILIZADO');
      } else if (statusHttp === 403) {
        setStatus('error_wrong_event');
        setFeedbackMsg('INGRESSO DE OUTRO EVENTO');
      } else if (statusHttp === 400 || statusHttp === 404) {
        setStatus('error_invalid');
        setFeedbackMsg('INGRESSO INVÁLIDO');
      } else {
        setStatus('error_invalid');
        setFeedbackMsg(dataMsg);
      }
    }
  }

  function resetGate() {
    setStatus('idle');
    setFeedbackMsg('');
    setTicketCode('');
    setSecureHash('');
  }

  return (
    <div className="container gate-page">
      <header className="gate-page__header">
        <h1>Validação de Portaria</h1>
        <p>Selecione o evento e insira os dados do ingresso para liberar o acesso.</p>
      </header>

      <section className="gate-page__context">
        <label htmlFor="event-select" className="sr-only">Evento da Portaria</label>
        <select 
          id="event-select" 
          value={selectedEventId} 
          onChange={(e) => setSelectedEventId(e.target.value)}
          className="gate-page__select"
          disabled={status === 'processing'}
        >
          {events.map(ev => (
            <option key={ev.id} value={ev.id}>{ev.title}</option>
          ))}
        </select>
      </section>

      <div className="gate-page__board">
        {/* Painel de Feedback Visual e Acessível */}
        <div 
          className={`gate-page__feedback gate-page__feedback--${status}`}
          aria-live="assertive"
        >
          {status === 'idle' && <span>Aguardando ingresso...</span>}
          {status === 'processing' && <span>Processando...</span>}
          {status === 'success' && (
            <div className="feedback-content">
              <span className="icon">✅</span>
              <strong>{feedbackMsg}</strong>
            </div>
          )}
          {(status === 'error_invalid' || status === 'error_used' || status === 'error_wrong_event') && (
            <div className="feedback-content">
              <span className="icon">❌</span>
              <strong>{feedbackMsg}</strong>
            </div>
          )}
        </div>

        {/* Formulário de Validação Manual (MVP) */}
        <form onSubmit={handleValidate} className="gate-page__form">
          <div className="form-group">
            <label htmlFor="ticketCode">Código do Ingresso (ticketCode)</label>
            <input 
              id="ticketCode"
              type="text" 
              value={ticketCode}
              onChange={e => setTicketCode(e.target.value)}
              placeholder="Ex: VRZ-8X92K"
              required
              disabled={status === 'processing'}
            />
          </div>

          <div className="form-group">
            <label htmlFor="secureHash">Hash de Segurança (secureHash)</label>
            <input 
              id="secureHash"
              type="text" 
              value={secureHash}
              onChange={e => setSecureHash(e.target.value)}
              placeholder="Hash extraído do QR Code..."
              required
              disabled={status === 'processing'}
            />
          </div>

          <div className="gate-page__actions">
            {status !== 'idle' && status !== 'processing' && (
              <button type="button" onClick={resetGate} className="btn-secondary">
                Limpar
              </button>
            )}
            <button type="submit" className="btn-primary" disabled={status === 'processing' || !selectedEventId}>
              {status === 'processing' ? 'Validando...' : 'Validar Ingresso'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
