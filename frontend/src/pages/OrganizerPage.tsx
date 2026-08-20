import { useState, useRef } from 'react';
import type { FormEvent } from 'react';
import { tmdbService } from '../services/tmdbService';
import type { ExternalEventDetails } from '../types/tmdb';
import './OrganizerPage.scss';

export function OrganizerPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ExternalEventDetails[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<ExternalEventDetails | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const previewRef = useRef<HTMLDivElement>(null);

  async function handleSearch(e: FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setError('');
    setHasSearched(true);
    setSelectedMovie(null); // Limpa seleção anterior ao buscar novamente

    try {
      const data = await tmdbService.searchMovies(query);
      setResults(data);
    } catch (err: any) {
      console.error(err);
      const msg = err.data?.error || 'Não foi possível buscar filmes no momento.';
      setError(msg);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSelect(movie: ExternalEventDetails) {
    setSelectedMovie(movie);
    
    // Opcional: Rolagem suave até a área de preview
    setTimeout(() => {
      previewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);

    // Se no futuro os detalhes listados precisarem de dados aprofundados
    // poderíamos fazer tmdbService.getMovieDetails(movie.externalId) aqui.
    // Como a F10.1 já retorna descrições boas na busca, vamos reaproveitar o objeto,
    // mas deixamos a estrutura pronta para consultar /:id se necessário.
  }

  return (
    <div className="container organizer-page">
      <header className="organizer-page__header">
        <h1>Painel do Organizador</h1>
        <p>Busque filmes na base da TMDb para importá-los como novos eventos na plataforma.</p>
      </header>

      <form onSubmit={handleSearch} className="organizer-page__search">
        <input 
          type="text" 
          placeholder="Ex: Matrix, Avatar, O Poderoso Chefão..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={isLoading}
        />
        <button type="submit" className="btn-primary" disabled={isLoading || !query.trim()}>
          {isLoading ? 'Buscando...' : 'Pesquisar'}
        </button>
      </form>

      {/* Tratamento de Estados Visuais */}
      {error && (
        <div className="organizer-page__status organizer-page__status--error" aria-live="assertive">
          {error}
        </div>
      )}

      {isLoading && (
        <div className="organizer-page__status" aria-live="polite">
          Consultando banco de dados externo...
        </div>
      )}

      {!isLoading && !error && hasSearched && results.length === 0 && (
        <div className="organizer-page__status">
          Nenhum filme encontrado para "{query}". Tente outro termo.
        </div>
      )}

      {/* Grid de Resultados */}
      {!isLoading && results.length > 0 && (
        <div className="organizer-page__grid">
          {results.map((movie) => (
            <button 
              type="button"
              key={movie.externalId} 
              className="organizer-page__card"
              onClick={() => handleSelect(movie)}
              aria-label={`Selecionar filme ${movie.title}`}
            >
              <img 
                src={movie.posterUrl || 'https://via.placeholder.com/300x450?text=Sem+Poster'} 
                alt={`Poster de ${movie.title}`} 
                loading="lazy"
              />
              <div className="info">
                <h3>{movie.title}</h3>
                <span>
                  {movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : 'Data não informada'}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Área de Preview do Filme Selecionado */}
      {selectedMovie && (
        <section className="organizer-page__preview" ref={previewRef} aria-live="polite">
          <img 
            src={selectedMovie.posterUrl || 'https://via.placeholder.com/300x450?text=Sem+Poster'} 
            alt={`Poster expandido de ${selectedMovie.title}`} 
          />
          <div className="details">
            <h2>{selectedMovie.title}</h2>
            <div className="meta">
              Lançamento: {selectedMovie.releaseDate ? new Date(selectedMovie.releaseDate).toLocaleDateString('pt-BR') : 'Desconhecido'}
              {' '} | ID TMDb: {selectedMovie.externalId}
            </div>
            <p>{selectedMovie.description}</p>
            
            <div className="actions">
              <button 
                type="button" 
                className="btn-secondary" 
                disabled
                title="A criação de eventos será habilitada na próxima fase"
              >
                Continuar com este filme (Em breve)
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
