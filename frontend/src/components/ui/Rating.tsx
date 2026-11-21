import { Star } from 'lucide-react';
import { cn } from '../../lib/utils';
import { RATING_LABELS } from '../../lib/utils';

interface RatingDisplayProps {
  value: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const sizes = { sm: 'h-3.5 w-3.5', md: 'h-4 w-4', lg: 'h-5 w-5' };

export const RatingDisplay = ({ value, size = 'md', showLabel = false, className }: RatingDisplayProps) => (
  <span className={cn('inline-flex items-center gap-1.5', className)} aria-label={`${value} out of 5 stars`}>
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(sizes[size], star <= value ? 'fill-gold text-gold' : 'fill-line text-line')}
          strokeWidth={1.5}
        />
      ))}
    </span>
    {showLabel && <span className="text-xs font-medium text-muted">{RATING_LABELS[value]}</span>}
  </span>
);
