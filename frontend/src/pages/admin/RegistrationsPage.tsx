import { Download, RefreshCw, Search, Trash2, Users } from 'lucide-react';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { PageHeader } from '../../components/admin/PageHeader';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageLoader } from '../../components/ui/Feedback';
import { FormField, Input } from '../../components/ui/FormFields';
import { Pagination } from '../../components/ui/Pagination';
import { api, downloadFile, errorMessage, toQuery } from '../../lib/api';
import { useToast } from '../../lib/toast';
import type { Registration, RegistrationListResponse } from '../../types';

const formatDate = (value: string): string =>
  new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

export const RegistrationsPage = () => {
  const { notify } = useToast();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Registration | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api<RegistrationListResponse>(
        `/registrations${toQuery({ search: appliedSearch, page })}`,
      );
      setRegistrations(data.registrations);
      setTotal(data.total);
      setPages(data.pages);
      if (page > data.pages) setPage(data.pages);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setLoading(false);
    }
  }, [appliedSearch, page, refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    void load();
  }, [load]);

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

  const handleSearch = (event: FormEvent) => {
    event.preventDefault();
    setPage(1);
    setAppliedSearch(search.trim());
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await downloadFile(`/reports/registrations/pdf${toQuery({ search: appliedSearch, dateFrom, dateTo })}`);
      notify('Registered people PDF downloaded.', 'success');
    } catch (caught) {
      notify(errorMessage(caught), 'error');
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete || deleting) return;
    setDeleting(true);
    try {
      await api(`/registrations/${pendingDelete.id}`, { method: 'DELETE' });
      notify('Registration removed.', 'success');
      setPendingDelete(null);
      await load();
    } catch (caught) {
      notify(errorMessage(caught), 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Registered People"
        description="Everyone who registered through the public join-us form."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => setRefreshKey((key) => key + 1)}
              icon={<RefreshCw className="h-4 w-4" />}
            >
              Refresh
            </Button>
            <Button onClick={() => void handleExport()} loading={exporting} icon={<Download className="h-4 w-4" />}>
              Export PDF
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Total registered</p>
          <p className="mt-2 text-3xl font-bold text-brand">{total}</p>
        </div>
        <div className="card p-5 sm:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Export the list</p>
          <p className="mt-2 text-[13px] leading-relaxed text-muted">
            The PDF includes the church logo, reporting period, totals, every registrant&apos;s contact details and their comments, with page numbers.
          </p>
        </div>
      </div>

      <div className="card mb-5 mt-5 p-4 sm:p-5">
        <form onSubmit={handleSearch} className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, parent, email, phone, location, status or school…"
              className="pl-10"
              maxLength={120}
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" variant="secondary">Search</Button>
          </div>
        </form>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <FormField label="Registered from">
            <Input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
          </FormField>
          <FormField label="Registered to">
            <Input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
          </FormField>
        </div>
        <p className="mt-3 text-[11px] leading-relaxed text-muted">
          Date filters apply to the PDF export. Search applies to both the list and the PDF.
        </p>
      </div>

      {error && (
        <div className="card mb-5 border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error} <button type="button" className="ml-2 font-semibold underline" onClick={() => void load()}>Retry</button>
        </div>
      )}

      <div className="card overflow-hidden">
        {loading && !registrations.length ? (
          <PageLoader label="Loading registrations…" />
        ) : registrations.length === 0 ? (
          <EmptyState
            icon={Users}
            title={appliedSearch ? 'No registrations match your search' : 'No registrations yet'}
            description={appliedSearch ? 'Try a different name, phone number or email address.' : 'When someone fills in the public registration form, their details will appear here.'}
          />
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[1200px] text-left text-sm">
                <thead>
                  <tr className="border-b border-line bg-soft/50 text-[11px] uppercase tracking-wide text-muted">
                    <th className="px-5 py-3 font-semibold">Name</th>
                    <th className="px-5 py-3 font-semibold">Parent / guardian</th>
                    <th className="px-5 py-3 font-semibold">Email</th>
                    <th className="px-5 py-3 font-semibold">Your phone</th>
                    <th className="px-5 py-3 font-semibold">Guardian phone</th>
                    <th className="px-5 py-3 font-semibold">Location</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 font-semibold">University / From</th>
                    <th className="px-5 py-3 font-semibold">Comments</th>
                    <th className="px-5 py-3 font-semibold">Received</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {registrations.map((item) => (
                    <tr key={item.id} className="border-b border-line/70 last:border-0 hover:bg-soft/40">
                      <td className="px-5 py-3 font-semibold text-ink">{item.full_name}</td>
                      <td className="px-5 py-3 text-muted">{item.parent_name}</td>
                      <td className="px-5 py-3 text-muted">{item.email || '—'}</td>
                      <td className="px-5 py-3 text-muted">{item.phone || '—'}</td>
                      <td className="px-5 py-3 text-muted">{item.guardian_phone || '—'}</td>
                      <td className="px-5 py-3 text-muted">{item.location}</td>
                      <td className="px-5 py-3"><span className="chip bg-brand-soft text-brand">{item.status}</span></td>
                      <td className="px-5 py-3 text-muted">{item.university || item.studying_at || '—'}</td>
                      <td className="max-w-[200px] truncate px-5 py-3 text-muted" title={item.comments || undefined}>{item.comments || '—'}</td>
                      <td className="px-5 py-3 text-muted">{formatDate(item.created_at)}</td>
                      <td className="px-5 py-3 text-right">
                        <button type="button" onClick={() => setPendingDelete(item)} className="rounded-lg p-2 text-muted hover:bg-red-50 hover:text-red-600" aria-label={`Delete registration from ${item.full_name}`}>
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-line lg:hidden">
              {registrations.map((item) => (
                <div key={item.id} className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-ink">{item.full_name}</p>
                      <p className="mt-1 text-xs text-muted">{formatDate(item.created_at)}</p>
                    </div>
                    <button type="button" onClick={() => setPendingDelete(item)} className="rounded-lg p-2 text-muted hover:bg-red-50 hover:text-red-600" aria-label={`Delete registration from ${item.full_name}`}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-[13px]">
                    <dt className="text-muted">Parent / guardian</dt><dd className="font-medium text-ink">{item.parent_name}</dd>
                    <dt className="text-muted">Your phone</dt><dd className="font-medium text-ink">{item.phone || '—'}</dd>
                    <dt className="text-muted">Guardian phone</dt><dd className="font-medium text-ink">{item.guardian_phone || '—'}</dd>
                    <dt className="text-muted">Email</dt><dd className="break-all font-medium text-ink">{item.email || '—'}</dd>
                    <dt className="text-muted">Lives in</dt><dd className="font-medium text-ink">{item.location}</dd>
                    <dt className="text-muted">Status</dt><dd className="font-medium text-brand">{item.status}</dd>
                    <dt className="text-muted">University / From</dt><dd className="font-medium text-ink">{item.university || item.studying_at || '—'}</dd>
                  </dl>
                  {item.comments && <p className="mt-4 rounded-xl bg-soft p-3 text-[13px] leading-relaxed text-muted">“{item.comments}”</p>}
                </div>
              ))}
            </div>
          </>
        )}
        <Pagination page={page} pages={pages} total={total} onChange={setPage} itemLabel="registration" />
      </div>

      <ConfirmDialog
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => void handleDelete()}
        title="Delete registration?"
        message={`Remove the registration from ${pendingDelete?.full_name ?? 'this person'}? This cannot be undone.`}
        confirmLabel="Delete"
        loading={deleting}
      />
    </div>
  );
};
