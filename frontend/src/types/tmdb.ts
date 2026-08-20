export interface ExternalEventDetails {
  externalId: string;
  title: string;
  description: string;
  posterUrl: string | null;
  releaseDate: string | null;
  source: 'TMDB';
}
