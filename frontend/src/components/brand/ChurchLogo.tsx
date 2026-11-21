import { cn } from '../../lib/utils';
import { useSettings } from '../../lib/settings';

interface ChurchLogoProps {
  subtitle?: string;
  size?: 'sm' | 'md' | 'lg';
  compact?: boolean;
  className?: string;
}

const Mark = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 64 64" aria-hidden="true" className={className}>
    <rect width="64" height="64" rx="14" fill="var(--primary)" />
    <rect x="29" y="15" width="6" height="34" rx="2" fill="var(--white)" />
    <rect x="15" y="29" width="34" height="6" rx="2" fill="var(--white)" />
    <circle cx="49" cy="15" r="4.5" fill="var(--secondary)" />
  </svg>
);

export const ChurchLogo = ({ subtitle, size = 'md', compact = false, className }: ChurchLogoProps) => {
  const { settings } = useSettings();
  const dimensions = {
    sm: { mark: 'h-8 w-8', logo: 'h-10 w-10', title: 'text-[13px]', sub: 'text-[10px]' },
    md: { mark: 'h-10 w-10', logo: 'h-12 w-12', title: 'text-[15px]', sub: 'text-[11px]' },
    lg: { mark: 'h-14 w-14', logo: 'h-16 w-16', title: 'text-xl', sub: 'text-xs' },
  }[size];

  return (
    <div className={cn('flex min-w-0 items-center gap-3', className)}>
      {settings.logo_url ? (
        <img
          src={settings.logo_url}
          alt={`${settings.church_name} logo`}
          className={cn(dimensions.logo, 'shrink-0 object-contain')}
        />
      ) : (
        <Mark className={cn(dimensions.mark, 'shrink-0')} />
      )}
      {!compact && (
        <div className="min-w-0 leading-tight">
          <div className={cn('break-words font-bold tracking-tight text-ink', dimensions.title)}>{settings.church_name}</div>
          {subtitle && <div className={cn('mt-0.5 truncate font-medium tracking-wide text-muted', dimensions.sub)}>{subtitle}</div>}
        </div>
      )}
    </div>
  );
};

export { Mark as ChurchMark };
