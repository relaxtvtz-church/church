import { ArrowLeft, MessageSquareText, Star } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PageHeader } from '../../components/admin/PageHeader';
import { DistributionBars } from '../../components/charts/Charts';
import { Avatar } from '../../components/ui/Avatar';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageLoader } from '../../components/ui/Feedback';
import { RatingDisplay } from '../../components/ui/Rating';
import { StatusBadge } from '../../components/ui/Badge';
import { api, errorMessage } from '../../lib/api';
import { formatDateTime } from '../../lib/utils';
import type { Review, StaffMember } from '../../types';

interface StaffProfileResponse {
  staff: StaffMember;
  distribution: { rating: number; count: number }[];
  recentReviews: Review[];
}

export const StaffDetailPage = () => {
  const { id } = useParams();
  const [profile, setProfile] = useState<StaffProfileResponse | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    void api<StaffProfileResponse>(`/staff/${id}`)
      .then(setProfile)
      .catch((caught) => setError(errorMessage(caught)));
  }, [id]);

  if (!profile && !error) return <PageLoader />;

  if (error) {
    return (
      <div>
        <PageHeader title="Staff profile" description="Profile details and feedback." />
        <div className="card p-8 text-center text-sm text-red-600">{error}</div>
      </div>
    );
  }
  if (!profile) return null;

  const { staff } = profile;

  return (
    <div>
      <Link to="/admin/staff" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-brand">
        <ArrowLeft className="h-4 w-4" /> Back to staff
      </Link>
      <PageHeader title={staff.full_name} description={staff.position || 'Ministry team member'} />

      <div className="card p-5 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <Avatar name={staff.full_name} src={staff.photo_url} size="xl" />
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-xl font-bold text-ink">{staff.full_name}</h2>
              <StatusBadge status={staff.status} />
            </div>
            <p className="mt-1 text-sm font-medium text-brand">{staff.position || 'Ministry team'}</p>
            {staff.ministry && <p className="mt-0.5 text-sm text-muted">{staff.ministry}</p>}
            {staff.bio && <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">{staff.bio}</p>}
          </div>
          <div className="grid shrink-0 grid-cols-2 gap-3 sm:w-64">
            <div className="rounded-xl bg-soft p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Total reviews</p>
              <p className="mt-1.5 text-2xl font-bold text-ink">{staff.total_reviews ?? 0}</p>
            </div>
            <div className="rounded-xl bg-brand-soft p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-brand/80">Average</p>
              <p className="mt-1.5 text-2xl font-bold text-brand">{staff.average_rating ? staff.average_rating.toFixed(1) : '—'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div className="card p-5 sm:p-6">
          <h3 className="text-base font-bold text-ink">Rating distribution</h3>
          <p className="mt-1 text-xs text-muted">Based on non-archived reviews</p>
          <div className="mt-6">
            <DistributionBars data={profile.distribution} />
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="border-b border-line px-5 py-5 sm:px-6">
            <h3 className="text-base font-bold text-ink">Recent feedback</h3>
            <p className="mt-1 text-xs text-muted">The five latest reviews for this staff member</p>
          </div>
          {profile.recentReviews.length ? (
            <div className="divide-y divide-line">
              {profile.recentReviews.map((review) => (
                <div key={review.id} className="px-5 py-4 sm:px-6">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[13px] font-semibold text-ink">{review.reviewer_name ?? 'Anonymous'}</p>
                      <p className="mt-0.5 text-[11px] text-muted">{formatDateTime(review.created_at)} · {review.category}</p>
                    </div>
                    <RatingDisplay value={review.rating} size="sm" />
                  </div>
                  <p className="mt-2 line-clamp-3 text-[13px] leading-relaxed text-muted">{review.message}</p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={MessageSquareText} title="No reviews yet" description="Feedback submitted for this staff member will appear here." compact />
          )}
        </div>
      </div>

      {!staff.total_reviews && (
        <div className="mt-5 rounded-xl border border-brand/20 bg-brand-soft/60 p-4 text-sm text-brand">
          <Star className="mr-2 inline h-4 w-4" />
          This staff member has not received any reviews yet. Ratings are calculated automatically as feedback arrives.
        </div>
      )}
    </div>
  );
};
