import { Request, Response } from "express";
import { EventService } from "../services/eventService";
import { AppError } from "../lib/AppError";
import { createEventSchema } from "../schemas/eventSchema";

const eventService = new EventService();

export class EventController {
  async list(req: Request, res: Response) {
    try {
      const events = await eventService.listAll();
      return res.status(200).json(events);
    } catch (error: any) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      console.error(error);
      return res.status(500).json({ error: "Erro ao buscar eventos" });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const validation = createEventSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          error: "Dados inválidos.",
          details: validation.error.flatten().fieldErrors
        });
      }

      const eventData = validation.data;
      const organizerId = (req as any).user.id;

      const newEvent = await eventService.create(eventData, organizerId);

      return res.status(201).json(newEvent);
    } catch (error: any) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      console.error(error);
      return res.status(500).json({ error: "Erro ao criar evento." });
    }
  }
}
