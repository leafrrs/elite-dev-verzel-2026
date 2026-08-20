import { Request, Response } from "express";
import { TicketService } from "../services/ticketService";
import { AppError } from "../lib/AppError";
import { validateTicketSchema } from "../schemas/ticketSchema";

const ticketService = new TicketService();

export class TicketController {
  async listMyTickets(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const tickets = await ticketService.listByUser(userId);
      return res.status(200).json(tickets);
    } catch (error: any) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      console.error(error);
      return res.status(500).json({ error: "Erro interno do servidor." });
    }
  }

  async Validate(req: Request, res: Response) {
    try {
      const validation = validateTicketSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          error: "Dados inválidos.",
          details: validation.error.flatten().fieldErrors
        });
      }

      const { ticketCode, secureHash, eventId } = validation.data;

      // Repassa o eventId da portaria para garantir que o ingresso pertence a este evento
      const result = await ticketService.validateTicket(
        ticketCode,
        secureHash,
        eventId
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

  async share(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { ticketCode } = req.params;

      const result = await ticketService.generateShareToken(userId, ticketCode);
      return res.status(201).json(result);
    } catch (error: any) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      console.error(error);
      return res.status(500).json({ error: "Erro interno do servidor." });
    }
  }

  async getShared(req: Request, res: Response) {
    try {
      const { shareToken } = req.params;
      const result = await ticketService.getSharedTicket(shareToken);
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
