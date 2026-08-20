import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { eventService } from '../services/eventService';
import { ticketService } from '../services/ticketService';
import type { EventModel } from '../types/event';
import { isTicketQrPayload } from '../types/ticketGuards';
import { QrScanner } from '../components/QrScanner/QrScanner';
import './GatePage.scss';

type ValidationState = 'idle' | 'processing' | 'success' | 'error_invalid' | 'error_used' | 'error_wrong_event';

export function GatePage() {
  const [events, setEvents] = useState<EventModel[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  
  const [ticketCode, setTicketCode] = useState('');
  
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

  function handleValidationResult(promise: Promise<any>) {
    setStatus('processing');
    setFeedbackMsg('Processando...');

    promise.then(response => {
      setStatus('success');
      setFeedbackMsg(response.message || 'INGRESSO VÁLIDO');
      setTicketCode('');
    }).catch(err => {
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
    });
  }

  // Tratador do Formulário Manual
  function handleManualSubmit(e: FormEvent) {
    e.preventDefault();
    if (!selectedEventId || !ticketCode) return;
    
    handleValidationResult(ticketService.validateManualTicket({
      ticketCode,
      eventId: selectedEventId
    }));
  }

  // Tratador da Câmera (Scanner)
  function handleScan(decodedText: string) {
    if (status !== 'idle') return; // Evita scans duplos durante o processamento
    
    try {
      const payload = JSON.parse(decodedText);
      
      // Type Guard: Verifica se o JSON tem os 3 campos exatos exigidos
      if (!isTicketQrPayload(payload)) {
        setStatus('error_invalid');
        setFeedbackMsg('QR Code não reconhecido pelo sistema.');
        return;
      }

      handleValidationResult(ticketService.validateTicket({
        ticketCode: payload.ticketCode,
        secureHash: payload.secureHash,
        eventId: selectedEventId 
      }));

    } catch (error) {
      // Se não for JSON (ex: leu um cardápio ou link de wifi), captura o erro sem quebrar
      setStatus('error_invalid');
      setFeedbackMsg('QR Code estruturalmente inválido.');
    }
  }

  function resetGate() {
    setStatus('idle');
    setFeedbackMsg('');
    setTicketCode('');
  }

  return (
    <div className="container gate-page">
      <header className="gate-page__header">
        <h1>Validação de Portaria</h1>
        <p>Selecione o evento e escaneie ou insira os dados para liberar o acesso.</p>
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
              <span className="icon">✓</span>
              <strong>{feedbackMsg}</strong>
            </div>
          )}
          {(status === 'error_invalid' || status === 'error_used' || status === 'error_wrong_event') && (
            <div className="feedback-content">
              <span className="icon">✕</span>
              <strong>{feedbackMsg}</strong>
            </div>
          )}
        </div>

        <div className="gate-page__actions-panel">
          {status !== 'idle' && status !== 'processing' ? (
            <div className="gate-page__next">
              <button type="button" onClick={resetGate} className="btn-primary">
                Escanear próximo ingresso
              </button>
            </div>
          ) : (
            <>
              {/* Leitor de Câmera */}
              <div className="gate-page__scanner-section">
                <QrScanner 
                  onScan={handleScan} 
                  isProcessing={status === 'processing'} 
                />
              </div>

              <div className="gate-page__divider">
                <span>OU</span>
              </div>

              {/* Formulário Manual */}
              <form onSubmit={handleManualSubmit} className="gate-page__form">
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

                <div className="gate-page__actions">
                  <button type="submit" className="btn-secondary" disabled={status === 'processing' || !selectedEventId}>
                    {status === 'processing' ? 'Validando...' : 'Validar Manualmente'}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
