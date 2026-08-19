import { Request, Response } from "express";
import { TicketService } from "../services/ticketService";
import { AppError } from "../lib/AppError";

const ticketService = new TicketService();

export class TicketController {
  async Validate(req: Request, res: Response) {
    try {
      const { ticketCode, secureHash } = req.body;

      if (!ticketCode || !secureHash) {
        return res.status(400).json({ error: "Faltam os dados do QR Code!" });
      }

      const result = await ticketService.validateTicket(ticketCode, secureHash);

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
