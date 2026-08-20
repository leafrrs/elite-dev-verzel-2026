import { Request, Response } from "express";
import { EventService } from "../services/eventService";
import { AppError } from "../lib/AppError";
import { createEventSchema, getEventByIdParamsSchema, updateEventSchema } from "../schemas/eventSchema";

const eventService = new EventService();

export class EventController {
  async update(req: Request, res: Response) {
    try {
      const idValidation = getEventByIdParamsSchema.safeParse(req.params);
      if (!idValidation.success) {
        return res.status(400).json({ error: "ID inválido.", details: idValidation.error.flatten().fieldErrors });
      }

      const bodyValidation = updateEventSchema.safeParse(req.body);
      if (!bodyValidation.success) {
        return res.status(400).json({ error: "Dados inválidos.", details: bodyValidation.error.flatten().fieldErrors });
      }

      if (Object.keys(bodyValidation.data).length === 0) {
        return res.status(400).json({ error: "Nenhum dado válido para atualização foi enviado." });
      }

      const eventId = idValidation.data.id;
      const organizerId = (req as any).user.id;

      const updatedEvent = await eventService.update(eventId, organizerId, bodyValidation.data);

      return res.status(200).json(updatedEvent);
    } catch (error: any) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      console.error(error);
      return res.status(500).json({ error: "Erro ao atualizar evento." });
    }
  }

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

  async listMyEvents(req: Request, res: Response) {
    try {
      const organizerId = (req as any).user.id;
      const events = await eventService.listByOrganizer(organizerId);
      return res.status(200).json(events);
    } catch (error: any) {
      console.error(error);
      return res.status(500).json({ error: "Erro ao buscar seus eventos" });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const validation = getEventByIdParamsSchema.safeParse(req.params);

      if (!validation.success) {
        return res.status(400).json({
          error: "ID inválido.",
          details: validation.error.flatten().fieldErrors
        });
      }

      const event = await eventService.getById(validation.data.id);
      return res.status(200).json(event);
    } catch (error: any) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      console.error(error);
      return res.status(500).json({ error: "Erro ao buscar evento" });
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
