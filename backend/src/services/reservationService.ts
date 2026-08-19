import { prisma } from "../lib/prisma";
import crypto from "crypto";

import { AppError } from "../lib/AppError";

export class ReservationService {
  async createReservation(eventId: string, userId: string, seatCode?: string) {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new Error("evento não endcontrado");
    }

    if (event.type === "SEATED" && seatCode) {
      return await this.reserveSeatedTicket(
        event.id,
        userId,
        event.price,
        seatCode,
      );
    } else if (event.type === "GENERAL_ADMISSION") {
      return await this.reserveGeneralTicket(event.id, userId, event.price);
    }

    throw new Error("tipo de evento invalido ou assento não informado.");
  }

  private async reserveSeatedTicket(
    eventId: string,
    userId: string,
    price: number,
    seatCode: string,
  ) {
    return await prisma.$transaction(async (tx) => {
      const seat = await tx.seat.findFirst({
        where: { eventId: eventId, seatCode: seatCode },
      });

      if (!seat) {
        throw new Error("Assento não existe neste evento.");
      }

      const updateResult = await tx.seat.updateMany({
        where: {
          id: seat.id,
          status: "AVAILABLE",
        },
        data: { status: "RESERVED" },
      });

      if (updateResult.count === 0) {
        throw new Error(
          "Assento indisponível ou já reservado por outra pessoa.",
        );
      }

      const reservation = await tx.reservation.create({
        data: {
          eventId,
          userId,
          seatId: seat.id,
          totalAmount: price,
          status: "PENDING",
        },
      });

      return reservation;
    });
  }

  private async reserveGeneralTicket(
    eventId: string,
    userId: string,
    price: number,
  ) {
    return await prisma.$transaction(async (tx) => {
      const event = await tx.event.findUnique({
        where: { id: eventId },
      });
      if (!event || event.availableStock <= 0) {
        throw new Error("Ingressos esgotados para este evento!");
      }
      await tx.event.update({
        where: { id: eventId },
        data: { availableStock: { decrement: 1 } },
      });
      const reservation = await tx.reservation.create({
        data: {
          eventId,
          userId,
          totalAmount: price,
          status: "PENDING",
        },
      });
      return reservation;
    });
  }

  async processPayment(
    reservationId: string,
    userId: string,
    isApproved: boolean,
  ) {
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { event: true, tickets: true },
    });

    if (!reservation) throw new AppError("Reserva não encontrada.", 404);
    if (reservation.userId !== userId) {
      throw new AppError(
        "Acesso negado. Você não é o dono desta reserva.",
        403,
      );
    }

    if (reservation.status !== "PENDING")
      throw new AppError("esta reserva ja foi processada.", 409);

    if (!isApproved) {
      await prisma.$transaction(async (tx) => {
        await tx.reservation.update({
          where: { id: reservationId },
          data: { status: "REFUSED" },
        });

        if (reservation.event.type === "SEATED" && reservation.seatId) {
          await tx.seat.update({
            where: { id: reservation.seatId },
            data: { status: "AVAILABLE" },
          });
        } else if (reservation.event.type === "GENERAL_ADMISSION") {
          await tx.event.update({
            where: { id: reservation.event.id },
            data: { availableStock: { increment: 1 } },
          });
        }
      });

      return {
        message: "Pagamento recusado. Ingresso liberado para o publico.",
      };
    }

    return await prisma.$transaction(async (tx) => {
      await tx.reservation.update({
        where: { id: reservationId },
        data: { status: "CONFIRMED" },
      });

      if (reservation.event.type === "SEATED" && reservation.seatId) {
        await tx.seat.update({
          where: { id: reservation.seatId },
          data: { status: "SOLD" },
        });
      }

      const ticketCode = `VZR-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

      const secureHash = crypto
        .createHmac("sha256", process.env.QR_SECRET_KEY as string)
        .update(ticketCode)
        .digest("hex");

      const ticket = await tx.ticket.create({
        data: {
          ticketCode,
          secureHash,
          eventId: reservation.event.id,
          userId: reservation.userId,
          reservationId: reservation.id,
          seatId: reservation.seatId,
        },
      });

      return {
        message: "Pagamento aprovado! Ingresso gerado com sucesso.",
        ticket,
      };
    });
  }
}
