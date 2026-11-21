import { cn } from '../../lib/utils';
import { initials } from '../../lib/utils';

interface AvatarProps {
  name: string;
  src?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizes = {
  sm: 'h-8 w-8 text-[11px]',
  md: 'h-10 w-10 text-xs',
  lg: 'h-14 w-14 text-base',
  xl: 'h-20 w-20 text-xl',
};

export const Avatar = ({ name, src, size = 'md', className }: AvatarProps) => (
  <div
    className={cn(
      'flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-soft font-bold text-brand',
      sizes[size],
      className,
    )}
    title={name}
  >
    {src ? <img src={src} alt={name} className="h-full w-full object-cover" /> : initials(name)}
  </div>
);
