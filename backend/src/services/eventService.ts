import { prisma } from "../lib/prisma";
import { AppError } from "../lib/AppError";

export class EventService {
  async listAll() {
    const events = await prisma.event.findMany({
      orderBy: {
        date: "asc",
      },
    });

    return events;
  }

  async getById(id: string) {
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        seats: {
          select: {
            id: true,
            seatCode: true,
            status: true
          }
        }
      }
    });

    if (!event) {
      throw new AppError("Evento não encontrado.", 404);
    }

    return event;
  }

  async create(data: any, organizerId: string) {
    const newEvent = await prisma.event.create({
      data: {
        title: data.title,
        description: data.description,
        bannerUrl: data.bannerUrl,
        date: new Date(data.date),
        location: data.location,
        price: data.price,
        type: data.type,
        totalCapacity: data.totalCapacity,
        availableStock: data.totalCapacity,
        externalSource: data.externalSource || "MANUAL",
        organizerId: organizerId,
      },
    });

    return newEvent;
  }
}
