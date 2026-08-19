import type { Seat as SeatModel } from '../../types/event';
import './Seat.scss';

interface SeatProps {
  seat: SeatModel;
  selected: boolean;
  onSelect: (seatCode: string) => void;
}

export function Seat({ seat, selected, onSelect }: SeatProps) {
  const isAvailable = seat.status === 'AVAILABLE';

  // Combinamos classes dinamicamente
  const className = `seat seat--${seat.status.toLowerCase()} ${selected ? 'seat--selected' : ''}`;

  return (
    <button
      type="button"
      className={className}
      disabled={!isAvailable}
      onClick={() => onSelect(seat.seatCode)}
      aria-label={`Assento ${seat.seatCode}, status: ${seat.status}`}
      aria-pressed={selected}
    >
      {seat.seatCode}
    </button>
  );
}
