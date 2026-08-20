import type { ValidateTicketPayload } from './ticket';

/**
 * Type Guard (Guarda de Tipo)
 * 
 * Verifica se um objeto `unknown` possui exatamente a estrutura e os tipos 
 * necessários para ser considerado um payload de QR Code de ingresso válido.
 */
export function isTicketQrPayload(value: unknown): value is ValidateTicketPayload {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const obj = value as Record<string, unknown>;

  return (
    typeof obj.ticketCode === 'string' && obj.ticketCode.trim() !== '' &&
    typeof obj.secureHash === 'string' && obj.secureHash.trim() !== '' &&
    typeof obj.eventId === 'string' && obj.eventId.trim() !== ''
  );
}
