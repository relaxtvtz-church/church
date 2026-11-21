import { Download, ImagePlus, Megaphone, RefreshCw, Save, Search, Trash2, Users } from 'lucide-react';
import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/admin/PageHeader';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { PageLoader } from '../../components/ui/Feedback';
import { FormField, Input, Textarea } from '../../components/ui/FormFields';
import { Pagination } from '../../components/ui/Pagination';
import { api, downloadFile, errorMessage, toQuery } from '../../lib/api';
import { useToast } from '../../lib/toast';
import type { Advertisement, Registration, RegistrationListResponse } from '../../types';

type FormValues = {
  title: string;
  description: string;
  university: string;
  ctaLabel: string;
  imageUrl: string | null;
  isActive: boolean;
};

const formatDate = (value: string): string =>
  new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

export const AdvertisePage = () => {
  const { notify } = useToast();
  const [form, setForm] = useState<FormValues | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [listLoading, setListLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [pendingDelete, setPendingDelete] = useState<Registration | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    void api<{ advertisement: Advertisement }>('/advertisement')
      .then(({ advertisement }) =>
        setForm({
          title: advertisement.title,
          description: advertisement.description,
          university: advertisement.university,
          ctaLabel: advertisement.cta_label,
          imageUrl: advertisement.image_url ?? '/brand/church-banner.jpg',
          isActive: advertisement.is_active === 1,
        }),
      )
      .catch((error) => setLoadError(errorMessage(error)));
  }, []);

  useEffect(() => {
    let active = true;
    setListLoading(true);
    void api<RegistrationListResponse>(`/registrations${toQuery({ search: appliedSearch, page })}`)
      .then((data) => {
        if (!active) return;
        setRegistrations(data.registrations);
        setTotal(data.total);
        setPages(data.pages);
        if (page > data.pages) setPage(data.pages);
      })
      .catch((error) => {
        if (active) notify(errorMessage(error), 'error');
      })
      .finally(() => {
        if (active) setListLoading(false);
      });
    return () => {
      active = false;
    };
  }, [appliedSearch, page, refreshKey, notify]);

  // Pick up submissions made in another tab without requiring a manual reload.
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

  const set = <K extends keyof FormValues>(key: K, value: FormValues[K]) => {
    setForm((current) => (current ? { ...current, [key]: value } : current));
  };

  const handlePoster = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const data = new FormData();
      data.append('image', file);
      const result = await api<{ url: string }>('/uploads/image', { method: 'POST', body: data });
      set('imageUrl', result.url);
      notify('Poster uploaded. Save to publish it.', 'success');
    } catch (error) {
      notify(errorMessage(error), 'error');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
    if (!form || saving || uploading) return;
    setSaving(true);
    try {
      await api('/advertisement', { method: 'PUT', body: JSON.stringify(form) });
      notify('Advertisement updated. The public website has been refreshed.', 'success');
    } catch (error) {
      notify(errorMessage(error), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete || deleting) return;
    setDeleting(true);
    try {
      await api(`/registrations/${pendingDelete.id}`, { method: 'DELETE' });
      notify('Registration removed.', 'success');
      setPendingDelete(null);
      await api<RegistrationListResponse>(`/registrations${toQuery({ search: appliedSearch, page })}`).then((data) => {
        setRegistrations(data.registrations);
        setTotal(data.total);
        setPages(data.pages);
      });
    } catch (error) {
      notify(errorMessage(error), 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await downloadFile('/reports/registrations/pdf');
      notify('Registered people PDF downloaded.', 'success');
    } catch (error) {
      notify(errorMessage(error), 'error');
    } finally {
      setExporting(false);
    }
  };

  if (!form && !loadError) return <PageLoader />;

  if (!form) {
    return (
      <div>
        <PageHeader title="Advertise" description="Manage the public join-us poster and registration form." />
        <div className="card p-8 text-center text-sm text-red-600">{loadError}</div>
      </div>
    );
  }

  const poster = form.imageUrl ?? '/brand/church-banner.jpg';

  return (
    <div>
      <PageHeader
        title="Advertise"
        description="Edit the public poster and join-us message, and review everyone who registers."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => void handleExport()} loading={exporting} icon={<Download className="h-4 w-4" />}>
              Export PDF
            </Button>
            <Link to="/#freshers" target="_blank" className="rounded-xl border border-line bg-white px-3.5 py-2 text-sm font-semibold text-ink hover:border-brand/40">
              View public section ↗
            </Link>
          </div>
        }
      />

      <form onSubmit={(event) => void handleSave(event)} className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <div className="card p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
                <Megaphone className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-ink">Join-us announcement</h2>
                <p className="mt-1 text-xs text-muted">Changes appear on the public website immediately after saving.</p>
              </div>
            </div>
            <div className="mt-6 space-y-5">
              <FormField label="Title" required>
                <Input value={form.title} onChange={(event) => set('title', event.target.value)} maxLength={150} />
              </FormField>
              <FormField label="Description" hint="The message shown beside the poster">
                <Textarea value={form.description} onChange={(event) => set('description', event.target.value)} rows={3} maxLength={1000} />
              </FormField>
              <div className="grid gap-5 sm:grid-cols-2">
                <FormField label="University / Where you're from" hint="Optional highlight shown on the public section">
                  <Input value={form.university} onChange={(event) => set('university', event.target.value)} placeholder="e.g. University of Dar es Salaam" maxLength={250} />
                </FormField>
                <FormField label="Registration button text">
                  <Input value={form.ctaLabel} onChange={(event) => set('ctaLabel', event.target.value)} placeholder="Register your interest" maxLength={80} />
                </FormField>
              </div>
            </div>
          </div>

          <div className="card p-5 sm:p-6">
            <h2 className="text-base font-bold text-ink">Poster image</h2>
            <p className="mt-1 text-xs text-muted">Upload a poster to replace the bundled fellowship image. The full image is displayed without cropping.</p>
            <div className="mt-5 flex flex-wrap items-start gap-5 rounded-xl border border-dashed border-line bg-soft/50 p-4">
              <div className="flex h-44 w-32 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white p-1">
                <img src={poster} alt="Selected poster" className="h-full w-full object-contain" />
              </div>
              <div>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-line bg-white px-3 py-2 text-[13px] font-semibold text-ink hover:border-brand/40">
                  <ImagePlus className="h-4 w-4 text-brand" />
                  {uploading ? 'Uploading…' : 'Upload poster'}
                  <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={(event) => void handlePoster(event)} disabled={uploading} />
                </label>
                {form.imageUrl && (
                  <button type="button" onClick={() => set('imageUrl', '/brand/church-banner.jpg')} className="ml-3 text-xs font-semibold text-muted hover:text-brand">
                    Use default
                  </button>
                )}
                <p className="mt-2 text-[11px] text-muted">JPG, PNG, WEBP or GIF · max 3MB</p>
              </div>
            </div>
            <label className="mt-5 flex cursor-pointer items-center gap-3 rounded-xl border border-line bg-white p-4">
              <input type="checkbox" checked={form.isActive} onChange={(event) => set('isActive', event.target.checked)} className="h-4 w-4 accent-[var(--primary)]" />
              <span>
                <span className="block text-[13px] font-semibold text-ink">Show the join-us section publicly</span>
                <span className="mt-0.5 block text-[11px] text-muted">Turn this off to hide the section and registration form.</span>
              </span>
            </label>
          </div>
        </div>

        <div className="space-y-5">
          <div className="card p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/10 text-gold">
              <Users className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-sm font-bold text-ink">Registrations received</h3>
            <p className="mt-1 text-3xl font-bold text-brand">{total}</p>
            <p className="mt-2 text-[13px] leading-relaxed text-muted">
              Every registration submitted from the public website appears in the list below.
            </p>
            <Button type="submit" className="mt-5 w-full" loading={saving || uploading} icon={<Save className="h-4 w-4" />}>
              Save changes
            </Button>
          </div>
          <div className="rounded-xl border border-brand/20 bg-brand-soft/50 p-4 text-[13px] leading-relaxed text-muted">
            <span className="font-semibold text-ink">Tip:</span> keep the poster portrait-shaped for the cleanest full-image display.
          </div>
        </div>
      </form>

      <div className="card mt-6 overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-line p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-bold text-ink">Interested people</h2>
            <p className="mt-1 text-xs text-muted">Search by name, parent, email, phone, location, status, school or university.</p>
          </div>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              setPage(1);
              setAppliedSearch(search);
            }}
            className="flex gap-2"
          >
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search registrations" className="w-full pl-9 sm:w-64" maxLength={120} />
            </div>
            <Button type="submit" variant="secondary">Search</Button>
            <button
              type="button"
              onClick={() => setRefreshKey((key) => key + 1)}
              className="rounded-xl border border-line p-2.5 text-muted transition-colors hover:border-brand/40 hover:text-brand"
              title="Refresh registrations"
              aria-label="Refresh registrations"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </form>
        </div>

        {listLoading ? (
          <div className="p-8 text-center text-sm text-muted">Loading registrations…</div>
        ) : registrations.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-soft text-muted">
              <Users className="h-6 w-6" />
            </div>
            <p className="mt-4 text-sm font-semibold text-ink">No registrations yet</p>
            <p className="mt-1 text-[13px] text-muted">When someone fills in the public registration form, their details will appear here.</p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[1280px] text-left text-sm">
                <thead>
                  <tr className="border-b border-line bg-soft/50 text-[11px] uppercase tracking-wide text-muted">
                    <th className="px-5 py-3 font-semibold">Name</th>
                    <th className="px-5 py-3 font-semibold">Parent / guardian</th>
                    <th className="px-5 py-3 font-semibold">Email</th>
                    <th className="px-5 py-3 font-semibold">Your phone</th>
                    <th className="px-5 py-3 font-semibold">Guardian phone</th>
                    <th className="px-5 py-3 font-semibold">Where they live</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 font-semibold">Studying at</th>
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
                      <td className="px-5 py-3 text-muted">{item.studying_at || '—'}</td>
                      <td className="px-5 py-3 text-muted">{item.university || '—'}</td>
                      <td className="max-w-[220px] truncate px-5 py-3 text-muted" title={item.comments || undefined}>
                        {item.comments || '—'}
                      </td>
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
                    <dt className="text-muted">Studying at</dt><dd className="font-medium text-ink">{item.studying_at || '—'}</dd>
                    <dt className="text-muted">University / From</dt><dd className="font-medium text-ink">{item.university || '—'}</dd>
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
