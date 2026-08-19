import { Request, Response } from "express";
import { ReservationService } from "../services/reservationService";
import { AppError } from "../lib/AppError";

const reservationService = new ReservationService();

export class ReservationController {
  async create(req: Request, res: Response) {
    try {
      const { eventId, seatCode } = req.body;

      const userId = (req as any).user.id;

      if (!eventId) {
        return res.status(400).json({ error: "O ID do evento é obrigatório." });
      }

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
      return res.status(400).json({ error: error.message });
    }
  }

  async pay(req: Request, res: Response) {
    try {
      const { reservationId } = req.params;
      const { approved } = req.body;

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
