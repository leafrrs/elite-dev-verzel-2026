import { Request, Response } from "express";
import { TmdbService } from "../services/tmdbService";
import { searchTmdbQuerySchema, tmdbIdParamSchema } from "../schemas/tmdbSchema";
import { AppError } from "../lib/AppError";

const tmdbService = new TmdbService();

export class TmdbController {
  async search(req: Request, res: Response) {
    try {
      const validation = searchTmdbQuerySchema.safeParse(req.query);

      if (!validation.success) {
        return res.status(400).json({
          error: "Query inválida.",
          details: validation.error.flatten().fieldErrors,
        });
      }

      const results = await tmdbService.searchMovies(validation.data.query);
      return res.status(200).json(results);
    } catch (error: any) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      console.error("TmdbController.search Error:", error);
      return res.status(500).json({ error: "Erro interno ao buscar filmes externos." });
    }
  }

  async getDetails(req: Request, res: Response) {
    try {
      const validation = tmdbIdParamSchema.safeParse(req.params);

      if (!validation.success) {
        return res.status(400).json({
          error: "ID inválido.",
          details: validation.error.flatten().fieldErrors,
        });
      }

      const details = await tmdbService.getMovieDetails(validation.data.id);
      return res.status(200).json(details);
    } catch (error: any) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      console.error("TmdbController.getDetails Error:", error);
      return res.status(500).json({ error: "Erro interno ao buscar detalhes do filme." });
    }
  }
}
