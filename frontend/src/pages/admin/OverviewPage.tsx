import { ArrowUpRight, CalendarDays, MessageSquareText, RefreshCw, Star, Users } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/admin/PageHeader';
import { DistributionBars, StaffRatingBars, SubmissionsChart } from '../../components/charts/Charts';
import { Avatar } from '../../components/ui/Avatar';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageLoader } from '../../components/ui/Feedback';
import { RatingDisplay } from '../../components/ui/Rating';
import { api, errorMessage } from '../../lib/api';
import { useSettings } from '../../lib/settings';
import { formatDate } from '../../lib/utils';
import type { OverviewStats } from '../../types';

const StatCard = ({
  label,
  value,
  detail,
  icon: Icon,
  accent = false,
}: {
  label: string;
  value: string;
  detail: string;
  icon: typeof Star;
  accent?: boolean;
}) => (
  <div className="card hover-lift p-5">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
        <p className={`mt-3 text-3xl font-bold tracking-tight ${accent ? 'text-brand' : 'text-ink'}`}>{value}</p>
        <p className="mt-1.5 text-xs text-muted">{detail}</p>
      </div>
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${accent ? 'bg-brand-soft text-brand' : 'bg-soft text-muted'}`}>
        <Icon className="h-5 w-5" />
      </div>
    </div>
  </div>
);

export const OverviewPage = () => {
  const { settings } = useSettings();
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setError('');
    void api<OverviewStats>('/stats')
      .then(setStats)
      .catch((caught) => setError(errorMessage(caught)));
  }, []);

  useEffect(load, [load]);

  // Keep the dashboard counts in sync with submissions made in another tab.
  useEffect(() => {
    const onVisibility = () => {
      if (!document.hidden) load();
    };
    window.addEventListener('focus', load);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('focus', load);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [load]);

  if (!stats && !error) return <PageLoader />;

  if (error) {
    return (
      <div>
        <PageHeader title="Overview" description="A snapshot of ministry feedback." />
        <div className="card p-8 text-center">
          <p className="text-sm text-red-600">{error}</p>
          <button type="button" onClick={load} className="mt-4 text-sm font-semibold text-brand hover:underline">
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div>
      <PageHeader
        title="Overview"
        description={`Welcome back. Here is what ${settings.church_name} is hearing from your community.`}
        actions={
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={load}
              className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-white px-3.5 py-2 text-sm font-semibold text-ink hover:border-brand/40"
            >
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
            <Link to="/admin/reports" className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-white px-3.5 py-2 text-sm font-semibold text-ink hover:border-brand/40">
              View reports <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Reviews" value={String(stats.totalReviews)} detail="All feedback received" icon={MessageSquareText} />
        <StatCard label="Overall Average" value={stats.averageRating ? stats.averageRating.toFixed(1) : '—'} detail="Out of 5 stars" icon={Star} accent />
        <StatCard label="Reviews This Month" value={String(stats.reviewsThisMonth)} detail="Submitted since the 1st" icon={CalendarDays} />
        <StatCard label="Active Staff" value={String(stats.activeStaff)} detail="Available for reviews" icon={Users} />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div className="card p-5 sm:p-6">
          <h2 className="text-base font-bold text-ink">Rating distribution</h2>
          <p className="mt-1 text-xs text-muted">How the congregation is rating their experience</p>
          <div className="mt-6">
            <DistributionBars data={stats.distribution} />
          </div>
        </div>
        <div className="card p-5 sm:p-6">
          <h2 className="text-base font-bold text-ink">Feedback submissions</h2>
          <p className="mt-1 text-xs text-muted">Reviews received over the last 12 months</p>
          <SubmissionsChart data={stats.submissions} />
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div className="card p-5 sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-ink">Average rating per staff member</h2>
              <p className="mt-1 text-xs text-muted">Calculated from all non-archived reviews</p>
            </div>
            <Link to="/admin/ratings" className="shrink-0 text-xs font-semibold text-brand hover:underline">
              See all
            </Link>
          </div>
          <StaffRatingBars staff={stats.staffRatings} />
        </div>

        <div className="card overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-5 sm:px-6">
            <div>
              <h2 className="text-base font-bold text-ink">Recent feedback</h2>
              <p className="mt-1 text-xs text-muted">The latest submissions</p>
            </div>
            <Link to="/admin/reviews" className="shrink-0 text-xs font-semibold text-brand hover:underline">
              View all
            </Link>
          </div>
          {stats.recentReviews.length ? (
            <div className="divide-y divide-line">
              {stats.recentReviews.map((review) => (
                <div key={review.id} className="px-5 py-4 sm:px-6">
                  <div className="flex items-start gap-3">
                    <Avatar name={review.reviewer_name ?? 'Anonymous'} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                        <p className="text-[13px] font-semibold text-ink">{review.reviewer_name ?? 'Anonymous'}</p>
                        <span className="text-[11px] text-muted">{formatDate(review.created_at)}</span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <RatingDisplay value={review.rating} size="sm" />
                        <span className="text-[11px] text-muted">
                          {review.staff_name || 'General Church Feedback'} · {review.category}
                        </span>
                      </div>
                      <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-muted">{review.message}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={MessageSquareText}
              title="No reviews yet"
              description="Feedback submitted through the public portal will appear here."
              compact
            />
          )}
        </div>
      </div>
    </div>
  );
};
