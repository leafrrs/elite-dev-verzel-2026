import { Link } from 'react-router-dom';
import type { EventModel } from '../../types/event';
import { formatCurrency, formatDate } from '../../utils/formatters';
import './EventCard.scss';

interface EventCardProps {
  event: EventModel;
}

export function EventCard({ event }: EventCardProps) {
  // Fallback discreto, sem criar dependência de imagens externas instáveis
  const bannerImg = event.bannerUrl || 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22400%22%20height%3D%22200%22%20viewBox%3D%220%200%20400%20200%22%3E%3Crect%20width%3D%22400%22%20height%3D%22200%22%20fill%3D%22%232A2A2A%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22100%22%20fill%3D%22%23555555%22%20font-family%3D%22sans-serif%22%20font-size%3D%2216%22%20text-anchor%3D%22middle%22%20alignment-baseline%3D%22middle%22%3ESem%20imagem%3C%2Ftext%3E%3C%2Fsvg%3E';

  return (
    <article className="event-card">
      <div className="event-card__banner">
        <img src={bannerImg} alt={`Banner do evento ${event.title}`} loading="lazy" />
        <span className="event-card__badge">
          {event.type === 'SEATED' ? 'Cadeiras' : 'Pista'}
        </span>
      </div>

      <div className="event-card__content">
        <h3 className="event-card__title">{event.title}</h3>
        <p className="event-card__date">{formatDate(event.date)}</p>
        <p className="event-card__location">{event.location}</p>
        
        <div className="event-card__footer">
          <span className="event-card__price">{formatCurrency(event.price)}</span>
          <Link to={`/events/${event.id}`} className="btn-secondary">
            Ver detalhes
          </Link>
        </div>
      </div>
    </article>
  );
}
