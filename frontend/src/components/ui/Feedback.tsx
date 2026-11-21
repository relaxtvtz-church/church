import { Loader2 } from 'lucide-react';

export const PageLoader = ({ label = 'Loading…' }: { label?: string }) => (
  <div className="flex min-h-[50vh] items-center justify-center gap-3 text-sm text-muted">
    <Loader2 className="h-5 w-5 animate-spin text-brand" />
    {label}
  </div>
);

export const InlineLoader = () => <Loader2 className="h-4 w-4 animate-spin text-brand" />;
