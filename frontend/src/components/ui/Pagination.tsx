import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';

interface PaginationProps {
  page: number;
  pages: number;
  total: number;
  onChange: (page: number) => void;
  itemLabel?: string;
}

export const Pagination = ({ page, pages, total, onChange, itemLabel = 'review' }: PaginationProps) => {
  if (total === 0) return null;
  const numbers = Array.from({ length: Math.min(pages, 5) }, (_, index) => {
    const start = Math.max(1, Math.min(page - 2, pages - 4));
    return start + index;
  }).filter((number) => number <= pages);

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-line px-5 py-4 sm:flex-row">
      <p className="text-xs text-muted">
        Showing page <span className="font-semibold text-ink">{page}</span> of{' '}
        <span className="font-semibold text-ink">{pages}</span> · {total} {itemLabel}
        {total === 1 ? '' : 's'}
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-muted hover:bg-soft disabled:opacity-40"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {numbers.map((number) => (
          <button
            type="button"
            key={number}
            onClick={() => onChange(number)}
            className={cn(
              'h-8 min-w-8 rounded-lg px-2 text-xs font-semibold transition-colors',
              number === page ? 'bg-brand text-white' : 'text-muted hover:bg-soft hover:text-ink',
            )}
          >
            {number}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onChange(page + 1)}
          disabled={page >= pages}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-muted hover:bg-soft disabled:opacity-40"
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
