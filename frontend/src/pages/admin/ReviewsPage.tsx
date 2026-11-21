import { Archive, Check, Download, Eye, Filter, MessageSquareText, RefreshCw, RotateCcw, Search, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../../components/admin/PageHeader';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageLoader } from '../../components/ui/Feedback';
import { FormField, Input, Select } from '../../components/ui/FormFields';
import { Modal } from '../../components/ui/Modal';
import { Pagination } from '../../components/ui/Pagination';
import { RatingDisplay } from '../../components/ui/Rating';
import { StatusBadge } from '../../components/ui/Badge';
import { api, downloadFile, errorMessage, toQuery } from '../../lib/api';
import { useToast } from '../../lib/toast';
import { CATEGORIES, formatDateTime } from '../../lib/utils';
import type { Review, ReviewFilters, ReviewListResponse, StaffMember } from '../../types';

const initialFilters: ReviewFilters = {
  search: '',
  staffId: '',
  category: '',
  rating: '',
  status: '',
  dateFrom: '',
  dateTo: '',
};

const ratingOptions = [
  { value: '5', label: '5 stars — Excellent' },
  { value: '4', label: '4 stars — Very Good' },
  { value: '3', label: '3 stars — Good' },
  { value: '2', label: '2 stars — Fair' },
  { value: '1', label: '1 star — Poor' },
];

export const ReviewsPage = () => {
  const { notify } = useToast();
  const [filters, setFilters] = useState<ReviewFilters>(initialFilters);
  const [searchText, setSearchText] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ReviewListResponse | null>(null);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewing, setViewing] = useState<Review | null>(null);
  const [deleting, setDeleting] = useState<Review | null>(null);
  const [busy, setBusy] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const filterKey = JSON.stringify(filters);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await api<ReviewListResponse>(
        `/reviews${toQuery({ ...filters, page, limit: 10 })}`,
      );
      setData(result);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setLoading(false);
    }
  }, [filterKey, page, refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    void load();
  }, [load]);

  // Pick up feedback submitted in another tab without a manual reload.
  useEffect(() => {
    const refresh = () => setRefreshKey((key) => key + 1);
    const onVisibility = () => {
      if (!document.hidden) refresh();
    };
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  useEffect(() => {
    void api<{ staff: StaffMember[] }>('/staff')
      .then((result) => setStaff(result.staff))
      .catch(() => setStaff([]));
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setFilters((current) => ({ ...current, search: searchText.trim() || undefined }));
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchText]);

  const activeFilterCount = useMemo(
    () => Object.values(filters).filter((value) => value !== undefined && value !== '').length,
    [filters],
  );

  const changeFilter = (key: keyof ReviewFilters, value: string) => {
    setFilters((current) => ({ ...current, [key]: value || undefined }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters(initialFilters);
    setSearchText('');
    setPage(1);
  };

  const updateStatus = async (review: Review, status: Review['status']) => {
    setBusy(true);
    try {
      await api(`/reviews/${review.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      notify(status === 'reviewed' ? 'Review marked as reviewed.' : 'Review archived.', 'success');
      setViewing(null);
      await load();
    } catch (caught) {
      notify(errorMessage(caught), 'error');
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await api(`/reviews/${deleting.id}`, { method: 'DELETE' });
      notify('Review deleted.', 'success');
      setDeleting(null);
      setViewing(null);
      await load();
    } catch (caught) {
      notify(errorMessage(caught), 'error');
    } finally {
      setBusy(false);
    }
  };

  const exportPdf = async () => {
    setExporting(true);
    try {
      await downloadFile(`/reports/pdf${toQuery({ type: 'all', ...filters })}`);
      notify('PDF report downloaded.', 'success');
    } catch (caught) {
      notify(errorMessage(caught), 'error');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Reviews"
        description="Read, organise and respond to feedback from your community."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => setRefreshKey((key) => key + 1)}
              icon={<RefreshCw className="h-4 w-4" />}
            >
              Refresh
            </Button>
            <Button variant="outline" onClick={() => void exportPdf()} loading={exporting} icon={<Download className="h-4 w-4" />}>
              Export PDF
            </Button>
          </div>
        }
      />

      <div className="card mb-5 p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-ink">
            <Filter className="h-4 w-4 text-brand" />
            Filters
            {activeFilterCount > 0 && <span className="chip bg-brand-soft text-brand">{activeFilterCount} active</span>}
          </div>
          {activeFilterCount > 0 && (
            <button type="button" onClick={clearFilters} className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-brand">
              <RotateCcw className="h-3.5 w-3.5" /> Clear all
            </button>
          )}
        </div>

        <div className="relative mb-4">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="Search by name, staff member or feedback text…"
            className="pl-10"
            aria-label="Search reviews"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <FormField label="Staff member">
            <Select value={filters.staffId ?? ''} onChange={(event) => changeFilter('staffId', event.target.value)}>
              <option value="">All feedback</option>
              <option value="-1">General church feedback</option>
              {staff.map((member) => (
                <option key={member.id} value={member.id}>{member.full_name}</option>
              ))}
            </Select>
          </FormField>
          <FormField label="Category">
            <Select value={filters.category ?? ''} onChange={(event) => changeFilter('category', event.target.value)}>
              <option value="">All categories</option>
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </Select>
          </FormField>
          <FormField label="Rating">
            <Select value={filters.rating ?? ''} onChange={(event) => changeFilter('rating', event.target.value)}>
              <option value="">All ratings</option>
              {ratingOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </Select>
          </FormField>
          <FormField label="Status">
            <Select value={filters.status ?? ''} onChange={(event) => changeFilter('status', event.target.value)}>
              <option value="">All statuses</option>
              <option value="new">New</option>
              <option value="reviewed">Reviewed</option>
              <option value="archived">Archived</option>
            </Select>
          </FormField>
          <FormField label="From date">
            <Input type="date" value={filters.dateFrom ?? ''} onChange={(event) => changeFilter('dateFrom', event.target.value)} />
          </FormField>
          <FormField label="To date">
            <Input type="date" value={filters.dateTo ?? ''} onChange={(event) => changeFilter('dateTo', event.target.value)} />
          </FormField>
        </div>
      </div>

      {error && (
        <div className="card mb-5 border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error} <button type="button" className="ml-2 font-semibold underline" onClick={() => void load()}>Retry</button>
        </div>
      )}

      <div className="card overflow-hidden">
        {loading && !data ? (
          <PageLoader />
        ) : !data?.reviews.length ? (
          <EmptyState
            icon={MessageSquareText}
            title={activeFilterCount ? 'No reviews match the selected filters' : 'No reviews yet'}
            description={
              activeFilterCount
                ? 'Try changing or clearing your filters to see more feedback.'
                : 'Feedback submitted through the public portal will appear here.'
            }
            action={activeFilterCount ? <Button variant="outline" onClick={clearFilters}>Clear filters</Button> : undefined}
          />
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[860px] text-left">
                <thead>
                  <tr className="border-b border-line bg-soft/50 text-[11px] font-bold uppercase tracking-wide text-muted">
                    <th className="px-5 py-3.5">Reviewer</th>
                    <th className="px-5 py-3.5">Staff member</th>
                    <th className="px-5 py-3.5">Category</th>
                    <th className="px-5 py-3.5">Rating</th>
                    <th className="px-5 py-3.5">Date</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {data.reviews.map((review) => (
                    <tr key={review.id} className="hover:bg-soft/40">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={review.reviewer_name ?? 'Anonymous'} size="sm" />
                          <div className="max-w-[160px]">
                            <p className="truncate text-[13px] font-semibold text-ink">{review.reviewer_name ?? 'Anonymous'}</p>
                            <p className="truncate text-[11px] text-muted">{review.phone ?? 'No phone'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-[13px] text-ink">{review.staff_name || <span className="text-muted">General feedback</span>}</td>
                      <td className="px-5 py-4 text-[13px] text-muted">{review.category}</td>
                      <td className="px-5 py-4"><RatingDisplay value={review.rating} size="sm" /></td>
                      <td className="px-5 py-4 text-[12px] text-muted">{formatDateTime(review.created_at)}</td>
                      <td className="px-5 py-4"><StatusBadge status={review.status} /></td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <IconAction label="View full review" onClick={() => setViewing(review)} icon={Eye} />
                          {review.status !== 'reviewed' && (
                            <IconAction label="Mark as reviewed" onClick={() => void updateStatus(review, 'reviewed')} icon={Check} busy={busy} />
                          )}
                          {review.status !== 'archived' && (
                            <IconAction label="Archive review" onClick={() => void updateStatus(review, 'archived')} icon={Archive} busy={busy} />
                          )}
                          <IconAction label="Delete review" onClick={() => setDeleting(review)} icon={Trash2} danger />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-line md:hidden">
              {data.reviews.map((review) => (
                <div key={review.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={review.reviewer_name ?? 'Anonymous'} size="sm" />
                      <div>
                        <p className="text-[13px] font-semibold text-ink">{review.reviewer_name ?? 'Anonymous'}</p>
                        <p className="text-[11px] text-muted">{formatDateTime(review.created_at)}</p>
                      </div>
                    </div>
                    <StatusBadge status={review.status} />
                  </div>
                  <p className="mt-3 line-clamp-2 text-[13px] leading-relaxed text-muted">{review.message}</p>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <RatingDisplay value={review.rating} size="sm" />
                      <span className="text-[11px] text-muted">{review.category}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <IconAction label="View full review" onClick={() => setViewing(review)} icon={Eye} />
                      <IconAction label="Mark as reviewed" onClick={() => void updateStatus(review, 'reviewed')} icon={Check} busy={busy} />
                      <IconAction label="Archive review" onClick={() => void updateStatus(review, 'archived')} icon={Archive} busy={busy} />
                      <IconAction label="Delete review" onClick={() => setDeleting(review)} icon={Trash2} danger />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Pagination page={data.page} pages={data.pages} total={data.total} onChange={setPage} />
          </>
        )}
      </div>

      <Modal open={!!viewing} onClose={() => setViewing(null)} title="Full review" description={viewing ? `Submitted ${formatDateTime(viewing.created_at)}` : undefined} size="md">
        {viewing && (
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <Avatar name={viewing.reviewer_name ?? 'Anonymous'} />
              <div>
                <p className="text-sm font-bold text-ink">{viewing.reviewer_name ?? 'Anonymous'}</p>
                <p className="text-xs text-muted">{viewing.phone ?? 'No phone number provided'}</p>
              </div>
              <div className="ml-auto"><StatusBadge status={viewing.status} /></div>
            </div>
            <div className="mt-5 grid gap-4 rounded-xl bg-soft p-4 sm:grid-cols-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Staff member</p>
                <p className="mt-1 text-sm font-semibold text-ink">{viewing.staff_name || 'General Church Feedback'}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Category</p>
                <p className="mt-1 text-sm font-semibold text-ink">{viewing.category}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Rating</p>
                <div className="mt-1"><RatingDisplay value={viewing.rating} showLabel /></div>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Submitted</p>
                <p className="mt-1 text-sm font-semibold text-ink">{formatDateTime(viewing.created_at)}</p>
              </div>
            </div>
            <div className="mt-5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Message</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink">{viewing.message}</p>
            </div>
            <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-line pt-5">
              <Button variant="ghost" onClick={() => setDeleting(viewing)} icon={<Trash2 className="h-4 w-4" />}>
                Delete
              </Button>
              {viewing.status !== 'archived' && (
                <Button variant="outline" onClick={() => void updateStatus(viewing, 'archived')} loading={busy} icon={<Archive className="h-4 w-4" />}>
                  Archive
                </Button>
              )}
              {viewing.status !== 'reviewed' && (
                <Button onClick={() => void updateStatus(viewing, 'reviewed')} loading={busy} icon={<Check className="h-4 w-4" />}>
                  Mark as reviewed
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => void confirmDelete()}
        title="Delete this review?"
        message="This review will be permanently removed. This action cannot be undone."
        confirmLabel="Delete review"
        loading={busy}
      />
    </div>
  );
};

const IconAction = ({
  icon: Icon,
  label,
  onClick,
  danger = false,
  busy = false,
}: {
  icon: typeof Eye;
  label: string;
  onClick: () => void;
  danger?: boolean;
  busy?: boolean;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={busy}
    title={label}
    aria-label={label}
    className={`rounded-lg p-2 transition-colors disabled:opacity-40 ${
      danger ? 'text-muted hover:bg-red-50 hover:text-red-600' : 'text-muted hover:bg-brand-soft hover:text-brand'
    }`}
  >
    <Icon className="h-4 w-4" />
  </button>
);
