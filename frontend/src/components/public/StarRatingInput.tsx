import { Star } from 'lucide-react';
import { useState } from 'react';
import { cn, RATING_LABELS } from '../../lib/utils';

interface StarRatingInputProps {
  value: number;
  onChange: (value: number) => void;
  error?: string;
}

export const StarRatingInput = ({ value, onChange, error }: StarRatingInputProps) => {
  const [hovered, setHovered] = useState(0);
  const active = hovered || value;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2" role="radiogroup" aria-label="Rating from 1 to 5 stars" aria-invalid={!!error}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={value === star}
            aria-label={`${star} star${star > 1 ? 's' : ''} — ${RATING_LABELS[star]}`}
            onClick={() => onChange(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            onFocus={() => setHovered(star)}
            onBlur={() => setHovered(0)}
            onKeyDown={(event) => {
              if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
                event.preventDefault();
                onChange(Math.min(5, (value || 0) + 1));
              }
              if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
                event.preventDefault();
                onChange(Math.max(1, (value || 5) - 1));
              }
            }}
            className="rounded-lg p-1 transition-transform hover:scale-110 focus:scale-110"
          >
            <Star
              className={cn(
                'h-8 w-8 transition-colors sm:h-9 sm:w-9',
                star <= active ? 'fill-gold text-gold' : 'fill-soft text-line',
              )}
              strokeWidth={1.5}
            />
          </button>
        ))}
        <span className="ml-2 text-sm font-semibold text-ink">
          {active ? RATING_LABELS[active] : <span className="font-normal text-muted">Select a rating</span>}
        </span>
      </div>
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </div>
  );
};
