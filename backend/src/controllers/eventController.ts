import { Request, Response } from "express";
import { EventService } from "../services/eventService";

const eventService = new EventService();

export class EventController {
  async list(req: Request, res: Response) {
    try {
      const events = await eventService.listAll();
      return res.status(200).json(events);
    } catch (error) {
      return res.status(500).json({ error: "erro ao buscar eventos" });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const eventData = req.body;

      const organizerId = (req as any).user.id;

      if (!eventData.title || !eventData.date || !eventData.price) {
        return res
          .status(400)
          .json({ error: "Titulo, data e preço são obrigatorios." });
      }

      const newEvent = await eventService.create(eventData, organizerId);

      return res.status(201).json(newEvent);
    } catch (error) {
      return res.status(500).json({ error: "erro ao criar evento." });
    }
  }
}
