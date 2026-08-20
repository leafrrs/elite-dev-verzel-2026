import { fetchApi } from './api';
import type { ExternalEventDetails } from '../types/tmdb';

export const tmdbService = {
  /**
   * Busca filmes através da nossa API (BFF), que por sua vez chama a TMDb.
   * Exige autenticação de ORGANIZER.
   */
  async searchMovies(query: string): Promise<ExternalEventDetails[]> {
    return fetchApi<ExternalEventDetails[]>(`/external/tmdb/search?query=${encodeURIComponent(query)}`);
  },

  /**
   * Obtém detalhes estendidos de um filme específico.
   * Retorna exatamente o mesmo contrato normalizado.
   */
  async getMovieDetails(id: string): Promise<ExternalEventDetails> {
    return fetchApi<ExternalEventDetails>(`/external/tmdb/${id}`);
  }
};
