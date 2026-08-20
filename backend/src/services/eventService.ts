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

  async listByOrganizer(organizerId: string) {
    const events = await prisma.event.findMany({
      where: { organizerId },
      orderBy: {
        createdAt: "desc", // Eventos mais recentes primeiro
      },
      select: {
        id: true,
        title: true,
        date: true,
        location: true,
        price: true,
        type: true,
        totalCapacity: true,
        availableStock: true,
        bannerUrl: true,
        externalSource: true,
        externalId: true,
      }
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
    const isSeated = data.type === "SEATED";
    const totalCapacity = data.totalCapacity;

    const eventPayload = {
      title: data.title,
      description: data.description || "",
      bannerUrl: data.bannerUrl,
      date: new Date(data.date),
      location: data.location,
      price: data.price,
      type: data.type,
      totalCapacity: totalCapacity,
      availableStock: totalCapacity,
      externalSource: data.externalSource || "MANUAL",
      externalId: data.externalId,
      organizerId: organizerId,
    };

    if (isSeated) {
      // Transação para garantir Event e Seats atômicos
      return await prisma.$transaction(async (tx) => {
        const newEvent = await tx.event.create({
          data: eventPayload
        });

        const seatData = [];
        const rowWidth = 10; // Convenção: 10 assentos por fileira
        let count = 0;
        let rowIndex = 0;

        while (count < totalCapacity) {
          // Lógica de base26 para gerar nomes de colunas estilo Excel (A..Z, AA..ZZ)
          let rowLetter = "";
          let temp = rowIndex;
          while (temp >= 0) {
            rowLetter = String.fromCharCode(65 + (temp % 26)) + rowLetter;
            temp = Math.floor(temp / 26) - 1;
          }

          for (let num = 1; num <= rowWidth && count < totalCapacity; num++) {
            seatData.push({
              eventId: newEvent.id,
              seatCode: `${rowLetter}${num}`,
              status: "AVAILABLE"
            });
            count++;
          }
          rowIndex++;
        }

        await tx.seat.createMany({
          data: seatData
        });

        return newEvent;
      });
    } else {
      // Fluxo simples para GENERAL_ADMISSION
      const newEvent = await prisma.event.create({
        data: eventPayload,
      });
      return newEvent;
    }
  }

  async update(id: string, organizerId: string, data: any) {
    const event = await prisma.event.findUnique({ where: { id } });

    if (!event) {
      throw new AppError("Evento não encontrado.", 404);
    }

    if (event.organizerId !== organizerId) {
      throw new AppError("Você não tem permissão para editar este evento.", 403);
    }

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.date && { date: new Date(data.date) }),
        ...(data.location && { location: data.location }),
        ...(data.price !== undefined && { price: data.price }),
      },
    });

    return updatedEvent;
  }
}
