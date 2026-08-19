import { Request, Response } from "express";
import { ReservationService } from "../services/reservationService";
import { AppError } from "../lib/AppError";
import { createReservationSchema, processPaymentBodySchema, processPaymentParamsSchema } from "../schemas/reservationSchema";

const reservationService = new ReservationService();

export class ReservationController {
  async create(req: Request, res: Response) {
    try {
      const validation = createReservationSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          error: "Dados inválidos.",
          details: validation.error.flatten().fieldErrors
        });
      }

      const { eventId, seatCode } = validation.data;
      const userId = (req as any).user.id;

      const reservation = await reservationService.createReservation(
        eventId,
        userId,
        seatCode,
      );

      return res.status(201).json({
        message: "Reserva criada com sucesso! Aguardando pagamento.",
        reservation,
      });
    } catch (error: any) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      console.error(error);
      return res.status(500).json({ error: "Erro interno do servidor." });
    }
  }

  async pay(req: Request, res: Response) {
    try {
      // Validação do parâmetro da rota (reservationId UUID)
      const paramsValidation = processPaymentParamsSchema.safeParse(req.params);
      if (!paramsValidation.success) {
        return res.status(400).json({
          error: "Dados inválidos na URL.",
          details: paramsValidation.error.flatten().fieldErrors
        });
      }

      // Validação do corpo da requisição (approved boolean)
      const bodyValidation = processPaymentBodySchema.safeParse(req.body);
      if (!bodyValidation.success) {
        return res.status(400).json({
          error: "Dados inválidos no corpo da requisição.",
          details: bodyValidation.error.flatten().fieldErrors
        });
      }

      const { reservationId } = paramsValidation.data;
      const { approved } = bodyValidation.data;
      const loggerUserId = (req as any).user.id;

      const result = await reservationService.processPayment(
        reservationId,
        loggerUserId,
        approved,
      );

      return res.status(200).json(result);
    } catch (error: any) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      console.error(error);
      return res.status(500).json({ error: "Erro interno do servidor." });
    }
  }
}
