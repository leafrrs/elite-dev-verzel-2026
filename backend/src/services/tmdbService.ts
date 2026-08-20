import { env } from "../config/env";
import { AppError } from "../lib/AppError";

// Contrato normalizado interno
export interface ExternalEventDetails {
  externalId: string;
  title: string;
  description: string;
  posterUrl: string | null;
  releaseDate: string | null;
  source: "TMDB";
}

export class TmdbService {
  private readonly baseUrl = "https://api.themoviedb.org/3";
  private readonly headers = {
    accept: "application/json",
    // TMDb v4 usa Bearer Token (Read Access Token)
    Authorization: `Bearer ${env.TMDB_ACCESS_TOKEN}`,
  };

  /**
   * Helper privado para lidar com os possíveis status retornados pela TMDb
   * e encapsular no AppError correto.
   */
  private handleTmdbError(response: Response) {
    if (response.status === 404) {
      throw new AppError("Filme não encontrado na base da TMDb.", 404);
    }
    if (response.status === 401 || response.status === 403) {
      console.error(`[TMDb Auth Error]: ${response.status} - ${response.statusText}`);
      throw new AppError("Problema de configuração ou autenticação na API externa.", 500);
    }
    if (response.status >= 500) {
      throw new AppError("Indisponibilidade temporária do serviço externo.", 502);
    }
    throw new AppError(`Erro na API do TMDb: ${response.statusText}`, response.status);
  }

  /**
   * Helper privado para lidar com erros de infra/rede do Node.js (fetch).
   */
  private handleNetworkError(error: unknown) {
    if (error instanceof AppError) throw error; // Erros já tratados

    if (error instanceof Error) {
      if (error.name === "TimeoutError" || error.name === "AbortError") {
        throw new AppError("A requisição para o serviço externo excedeu o tempo limite.", 504);
      }
    }
    
    // Erros genéricos de fetch caem como TypeError em falhas de rede (ENOTFOUND, ECONNREFUSED)
    throw new AppError("Falha de rede ao tentar contatar o serviço externo.", 502);
  }

  /**
   * Busca filmes pelo nome e normaliza a resposta para nosso contrato.
   */
  async searchMovies(query: string): Promise<ExternalEventDetails[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/search/movie?query=${encodeURIComponent(query)}&language=pt-BR&page=1`,
        { 
          headers: this.headers,
          signal: AbortSignal.timeout(5000) // Timeout real de 5s
        }
      );

      if (!response.ok) {
        this.handleTmdbError(response);
      }

      const data: any = await response.json();
      return (data.results || []).map((movie: any) => this.normalizeMovie(movie));
    } catch (error: unknown) {
      this.handleNetworkError(error);
      return []; // fallback por tipagem, embora o handleNetworkError lance throw
    }
  }

  /**
   * Busca detalhes de um filme específico pelo ID.
   */
  async getMovieDetails(externalId: string): Promise<ExternalEventDetails> {
    try {
      const response = await fetch(
        `${this.baseUrl}/movie/${externalId}?language=pt-BR`,
        { 
          headers: this.headers,
          signal: AbortSignal.timeout(5000) 
        }
      );

      if (!response.ok) {
        this.handleTmdbError(response);
      }

      const data: any = await response.json();
      return this.normalizeMovie(data);
    } catch (error: unknown) {
      this.handleNetworkError(error);
      throw error; // Garantia para o compilador (código nunca alcançado)
    }
  }

  /**
   * Converte a resposta nativa do TMDb para a interface interna.
   */
  private normalizeMovie(tmdbItem: any): ExternalEventDetails {
    // TMDb usa /caminhoDaImagem.jpg. Precisamos colocar a base url.
    const posterUrl = tmdbItem.poster_path 
      ? `https://image.tmdb.org/t/p/w500${tmdbItem.poster_path}`
      : null;

    return {
      externalId: String(tmdbItem.id),
      title: tmdbItem.title || tmdbItem.original_title || "Título Desconhecido",
      description: tmdbItem.overview || "Sem descrição disponível.",
      posterUrl,
      releaseDate: tmdbItem.release_date || null,
      source: "TMDB"
    };
  }
}
