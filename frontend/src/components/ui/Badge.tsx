import { cn } from '../../lib/utils';

const styles: Record<string, string> = {
  new: 'bg-brand-soft text-brand',
  reviewed: 'bg-emerald-50 text-emerald-700',
  archived: 'bg-soft text-muted',
  active: 'bg-emerald-50 text-emerald-700',
  inactive: 'bg-soft text-muted',
};

export const StatusBadge = ({ status }: { status: string }) => (
  <span className={cn('chip capitalize', styles[status] ?? 'bg-soft text-muted')}>
    <span className={cn('h-1.5 w-1.5 rounded-full', status === 'new' ? 'bg-brand' : status === 'active' || status === 'reviewed' ? 'bg-emerald-500' : 'bg-muted')} />
    {status}
  </span>
);
