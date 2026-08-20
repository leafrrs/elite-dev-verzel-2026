import { z } from "zod";

export const createEventSchema = z.object({
  title: z.string().trim().min(1, "O título é obrigatório."),
  description: z.string().trim().optional(),
  date: z.string().datetime("Data inválida. Use o formato ISO 8601 UTC (ex: 2024-12-01T20:00:00Z).").refine((val) => new Date(val) > new Date(), {
    message: "A data do evento deve estar no futuro."
  }),
  location: z.string().trim().min(1, "A localização é obrigatória."),
  price: z.number().positive("O preço deve ser maior que zero."),
  totalCapacity: z.number().int().positive("A capacidade deve ser maior que zero."),
  type: z.enum(["SEATED", "GENERAL_ADMISSION"], { 
    errorMap: () => ({ message: "O tipo deve ser SEATED ou GENERAL_ADMISSION." }) 
  }),
  bannerUrl: z.string().trim().url("URL do banner inválida.").optional(),
  externalSource: z.string().trim().optional(),
  externalId: z.string().trim().optional()
});

export const getEventByIdParamsSchema = z.object({
  id: z.string().uuid("ID do evento inválido (deve ser um UUID).")
});
