import { z } from "zod";

export const validateTicketSchema = z.object({
  ticketCode: z.string().trim().min(1, "O código do ingresso é obrigatório."),
  secureHash: z.string().trim().min(1, "O hash de segurança é obrigatório."),
  eventId: z.string().uuid("ID do evento inválido.")
});
