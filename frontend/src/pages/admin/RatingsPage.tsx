import { ChartNoAxesCombined, MessageSquareText, Star, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/admin/PageHeader';
import { DistributionBars } from '../../components/charts/Charts';
import { Avatar } from '../../components/ui/Avatar';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageLoader } from '../../components/ui/Feedback';
import { RatingDisplay } from '../../components/ui/Rating';
import { api, errorMessage } from '../../lib/api';
import type { OverviewStats } from '../../types';

export const RatingsPage = () => {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    void api<OverviewStats>('/stats')
      .then(setStats)
      .catch((caught) => setError(errorMessage(caught)));
  }, []);

  if (!stats && !error) return <PageLoader />;

  if (error || !stats) {
    return (
      <div>
        <PageHeader title="Ratings" description="Live ratings calculated from submitted feedback." />
        <div className="card p-8 text-center text-sm text-red-600">{error || 'Unable to load ratings.'}</div>
      </div>
    );
  }

  const generalAverage = stats.generalFeedback.average_rating ?? 0;

  return (
    <div>
      <PageHeader title="Ratings" description="Live ratings calculated from submitted feedback, never manually entered." />

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Overall average', value: stats.averageRating ? stats.averageRating.toFixed(1) : '—', detail: 'All non-archived reviews', icon: Star },
          { label: 'Rated staff', value: String(stats.staffRatings.filter((member) => member.total_reviews > 0).length), detail: `${stats.activeStaff} currently active`, icon: Users },
          { label: 'General feedback', value: String(stats.generalFeedback.total_reviews), detail: 'Not attributed to a person', icon: MessageSquareText },
        ].map((card) => (
          <div key={card.label} className="card flex items-start justify-between p-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">{card.label}</p>
              <p className="mt-3 text-3xl font-bold text-ink">{card.value}</p>
              <p className="mt-1 text-xs text-muted">{card.detail}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand">
              <card.icon className="h-5 w-5" />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <div className="card overflow-hidden lg:col-span-2">
          <div className="border-b border-line px-5 py-5 sm:px-6">
            <h2 className="text-base font-bold text-ink">Staff performance</h2>
            <p className="mt-1 text-xs text-muted">Ordered by average rating</p>
          </div>
          {stats.staffRatings.length ? (
            <div className="divide-y divide-line">
              {stats.staffRatings.map((member, index) => (
                <Link key={member.id} to={`/admin/staff/${member.id}`} className="flex items-center gap-3 px-5 py-4 transition-colors hover:bg-soft/50 sm:px-6">
                  <span className="w-5 shrink-0 text-xs font-bold text-muted">{index + 1}</span>
                  <Avatar name={member.full_name} src={member.photo_url} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">{member.full_name}</p>
                    <p className="truncate text-xs text-muted">{member.position || 'Ministry team'} · {member.total_reviews} review{member.total_reviews === 1 ? '' : 's'}</p>
                  </div>
                  <div className="hidden w-28 sm:block">
                    <div className="h-1.5 overflow-hidden rounded-full bg-soft">
                      <div className="h-full rounded-full bg-brand" style={{ width: `${((member.average_rating ?? 0) / 5) * 100}%` }} />
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-bold tabular-nums text-ink">{member.average_rating ? member.average_rating.toFixed(1) : '—'}</p>
                    {member.average_rating ? <RatingDisplay value={Math.round(member.average_rating)} size="sm" /> : <span className="text-[10px] text-muted">No reviews</span>}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Users}
              title="No staff members have been added yet"
              description="Add your ministry team to start tracking staff ratings."
              action={<Link to="/admin/staff" className="text-sm font-semibold text-brand hover:underline">Manage staff →</Link>}
            />
          )}
        </div>

        <div className="space-y-5">
          <div className="card p-5 sm:p-6">
            <h2 className="text-base font-bold text-ink">Overall distribution</h2>
            <p className="mt-1 text-xs text-muted">All non-archived feedback</p>
            <div className="mt-6"><DistributionBars data={stats.distribution} /></div>
          </div>
          <div className="card bg-brand p-5 text-white sm:p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold">General church feedback</h2>
              <ChartNoAxesCombined className="h-5 w-5 text-white/70" />
            </div>
            <p className="mt-4 text-4xl font-bold">{generalAverage ? generalAverage.toFixed(1) : '—'}</p>
            <p className="mt-1 text-xs text-white/75">Average from {stats.generalFeedback.total_reviews} submission{stats.generalFeedback.total_reviews === 1 ? '' : 's'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
