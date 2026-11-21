import { Star } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { cn } from '../../lib/utils';
import type { StaffRating } from '../../types';

export const DistributionBars = ({ data }: { data: { rating: number; count: number }[] }) => {
  const max = Math.max(1, ...data.map((item) => item.count));
  return (
    <div className="space-y-3.5">
      {[...data].reverse().map((item) => (
        <div key={item.rating} className="flex items-center gap-3">
          <div className="flex w-14 shrink-0 items-center gap-1 text-xs font-semibold text-muted">
            {item.rating}
            <Star className="h-3 w-3 fill-gold text-gold" />
          </div>
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-soft">
            <div
              className="h-full rounded-full bg-gold transition-all duration-500"
              style={{ width: `${(item.count / max) * 100}%` }}
            />
          </div>
          <span className="w-7 text-right text-xs font-semibold tabular-nums text-ink">{item.count}</span>
        </div>
      ))}
    </div>
  );
};

export const SubmissionsChart = ({ data }: { data: { month: string; count: number }[] }) => {
  const max = Math.max(1, ...data.map((item) => item.count));
  return (
    <div className="flex h-48 items-end gap-2 pt-4 sm:gap-3">
      {data.map((item, index) => (
        <div key={`${item.month}-${index}`} className="group flex h-full flex-1 flex-col items-center justify-end gap-2">
          <div className="relative flex w-full flex-1 items-end">
            <div
              className={cn(
                'w-full rounded-t-md bg-brand/85 transition-all duration-500 group-hover:bg-brand',
                item.count === 0 && 'min-h-[3px] bg-line',
              )}
              style={{ height: `${Math.max(3, (item.count / max) * 100)}%` }}
              title={`${item.month}: ${item.count} review${item.count === 1 ? '' : 's'}`}
            />
          </div>
          <span className="text-[10px] font-medium text-muted">{item.month}</span>
        </div>
      ))}
    </div>
  );
};

export const StaffRatingBars = ({ staff }: { staff: StaffRating[] }) => {
  if (!staff.length) {
    return <p className="py-6 text-center text-sm text-muted">No staff members yet.</p>;
  }
  return (
    <div className="space-y-4">
      {staff.map((member) => {
        const rating = member.average_rating ?? 0;
        return (
          <div key={member.id} className="flex items-center gap-3">
            <Avatar name={member.full_name} src={member.photo_url} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <p className="truncate text-[13px] font-semibold text-ink">{member.full_name}</p>
                <span className="shrink-0 text-xs font-semibold tabular-nums text-ink">
                  {rating ? rating.toFixed(1) : '—'}
                </span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-soft">
                <div className="h-full rounded-full bg-brand" style={{ width: `${(rating / 5) * 100}%` }} />
              </div>
            </div>
            <span className="w-16 shrink-0 text-right text-[11px] text-muted">
              {member.total_reviews} review{member.total_reviews === 1 ? '' : 's'}
            </span>
          </div>
        );
      })}
    </div>
  );
};
