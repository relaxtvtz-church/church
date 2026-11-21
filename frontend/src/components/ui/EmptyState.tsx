import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  compact?: boolean;
}

export const EmptyState = ({ icon: Icon, title, description, action, compact = false }: EmptyStateProps) => (
  <div className={`flex flex-col items-center justify-center text-center ${compact ? 'px-4 py-10' : 'px-6 py-16'}`}>
    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-soft text-brand">
      <Icon className="h-6 w-6" />
    </div>
    <h3 className="text-base font-bold text-ink">{title}</h3>
    <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted">{description}</p>
    {action && <div className="mt-5">{action}</div>}
  </div>
);
