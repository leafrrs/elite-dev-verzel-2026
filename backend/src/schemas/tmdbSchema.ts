import { z } from "zod";

export const searchTmdbQuerySchema = z.object({
  query: z.string().min(1, "A query de busca não pode ser vazia."),
});

export const tmdbIdParamSchema = z.object({
  id: z.string().regex(/^\d+$/, "ID do TMDb deve conter apenas números."),
});
