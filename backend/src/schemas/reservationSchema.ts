import { z } from "zod";

export const createReservationSchema = z.object({
  eventId: z.string().uuid("ID do evento inválido."),
  seatCode: z.string().trim().optional()
});

export const processPaymentParamsSchema = z.object({
  reservationId: z.string().uuid("ID da reserva inválido (deve ser um UUID).")
});

export const processPaymentBodySchema = z.object({
  approved: z.boolean({
    required_error: "O campo approved é obrigatório.",
    invalid_type_error: "O campo approved deve ser estritamente um booleano (true ou false)."
  })
});
