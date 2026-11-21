import { Church, ImagePlus, Save } from 'lucide-react';
import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/admin/PageHeader';
import { ChurchMark } from '../../components/brand/ChurchLogo';
import { Button } from '../../components/ui/Button';
import { PageLoader } from '../../components/ui/Feedback';
import { FormField, Input, Textarea } from '../../components/ui/FormFields';
import { api, errorMessage } from '../../lib/api';
import { useSettings } from '../../lib/settings';
import { useToast } from '../../lib/toast';
import type { AdminSettings } from '../../types';

type FormValues = {
  churchName: string;
  location: string;
  phone: string;
  email: string;
  welcomeMessage: string;
  feedbackIntro: string;
  footerText: string;
  serviceInfo: string;
  mapLat: string;
  mapLng: string;
  instagramUrl: string;
  tiktokUrl: string;
  facebookUrl: string;
  youtubeUrl: string;
  logoUrl: string | null;
};

export const ChurchInformationPage = () => {
  const { notify } = useToast();
  const { refresh } = useSettings();
  const [form, setForm] = useState<FormValues | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    void api<{ settings: AdminSettings }>('/settings')
      .then(({ settings }) =>
        setForm({
          churchName: settings.church_name,
          location: settings.location ?? '',
          phone: settings.phone ?? '',
          email: settings.email ?? '',
          welcomeMessage: settings.welcome_message ?? '',
          feedbackIntro: settings.feedback_intro ?? '',
          footerText: settings.footer_text ?? '',
          serviceInfo: settings.service_info ?? '',
          mapLat: settings.map_lat ?? '',
          mapLng: settings.map_lng ?? '',
          instagramUrl: settings.instagram_url ?? '',
          tiktokUrl: settings.tiktok_url ?? '',
          facebookUrl: settings.facebook_url ?? '',
          youtubeUrl: settings.youtube_url ?? '',
          logoUrl: settings.logo_url,
        }),
      )
      .catch((caught) => setError(errorMessage(caught)));
  }, []);

  const set = (key: keyof FormValues, value: string) => {
    setForm((current) => (current ? { ...current, [key]: value } : current));
  };

  const handleLogo = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !form) return;
    setUploading(true);
    try {
      const data = new FormData();
      data.append('image', file);
      const result = await api<{ url: string }>('/uploads/image', { method: 'POST', body: data });
      setForm({ ...form, logoUrl: result.url });
      notify('Logo uploaded. Save to apply it everywhere.', 'success');
    } catch (caught) {
      notify(errorMessage(caught), 'error');
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
      await api('/settings', { method: 'PUT', body: JSON.stringify(form) });
      await refresh();
      notify('Church information updated. The public website has been refreshed.', 'success');
    } catch (caught) {
      notify(errorMessage(caught), 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!form && !error) return <PageLoader />;

  if (error && !form) {
    return (
      <div>
        <PageHeader title="Church Information" description="Details shown across the public website and PDF reports." />
        <div className="card p-8 text-center text-sm text-red-600">{error}</div>
      </div>
    );
  }
  if (!form) return null;

  return (
    <div>
      <PageHeader
        title="Church Information"
        description="Update the details shown on the public website and PDF reports."
        actions={
          <Link to="/" target="_blank" className="rounded-xl border border-line bg-white px-3.5 py-2 text-sm font-semibold text-ink hover:border-brand/40">
            View public site ↗
          </Link>
        }
      />

      <form onSubmit={(event) => void handleSave(event)} className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <div className="card p-5 sm:p-6">
            <h2 className="text-base font-bold text-ink">Identity</h2>
            <p className="mt-1 text-xs text-muted">The church name and logo appear in the header, form and reports.</p>
            <div className="mt-5 space-y-5">
              <FormField label="Church name" required>
                <Input value={form.churchName} onChange={(event) => set('churchName', event.target.value)} maxLength={150} />
              </FormField>
              <div>
                <span className="label">Church logo</span>
                <div className="flex flex-wrap items-center gap-4 rounded-xl border border-dashed border-line bg-soft/50 p-4">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-white p-1">
                    {form.logoUrl ? (
                      <img src={form.logoUrl} alt="Selected church logo" className="h-full w-full object-contain" />
                    ) : (
                      <ChurchMark className="h-12 w-12" />
                    )}
                  </div>
                  <div>
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-line bg-white px-3 py-2 text-[13px] font-semibold text-ink hover:border-brand/40">
                      <ImagePlus className="h-4 w-4 text-brand" />
                      {uploading ? 'Uploading…' : 'Upload logo'}
                      <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={(event) => void handleLogo(event)} disabled={uploading} />
                    </label>
                    {form.logoUrl && (
                      <button type="button" onClick={() => setForm((current) => (current ? { ...current, logoUrl: null } : current))} className="ml-3 text-xs font-semibold text-muted hover:text-red-600">
                        Remove
                      </button>
                    )}
                    <p className="mt-2 text-[11px] text-muted">JPG, PNG or WEBP · max 3MB · displayed without distortion</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-5 sm:p-6">
            <h2 className="text-base font-bold text-ink">Contact & location</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <FormField label="Location"><Input value={form.location} onChange={(event) => set('location', event.target.value)} placeholder="Church address or area" maxLength={250} /></FormField>
              <FormField label="Service information"><Input value={form.serviceInfo} onChange={(event) => set('serviceInfo', event.target.value)} placeholder="e.g. Sundays, 9:00 AM" maxLength={500} /></FormField>
              <FormField label="Contact phone"><Input value={form.phone} onChange={(event) => set('phone', event.target.value)} placeholder="+255 …" maxLength={40} /></FormField>
              <FormField label="Contact email"><Input type="email" value={form.email} onChange={(event) => set('email', event.target.value)} placeholder="hello@example.org" maxLength={150} /></FormField>
              <FormField label="Map latitude" hint="Used for the Google Map on the public website">
                <Input value={form.mapLat} onChange={(event) => set('mapLat', event.target.value)} placeholder="-6.7980824" maxLength={30} />
              </FormField>
              <FormField label="Map longitude" hint="Used for the Google Map on the public website">
                <Input value={form.mapLng} onChange={(event) => set('mapLng', event.target.value)} placeholder="39.2302042" maxLength={30} />
              </FormField>
            </div>
          </div>

          <div className="card p-5 sm:p-6">
            <h2 className="text-base font-bold text-ink">Website messages</h2>
            <div className="mt-5 space-y-5">
              <FormField label="Welcome message" hint="Shown in the hero section of the public website">
                <Textarea value={form.welcomeMessage} onChange={(event) => set('welcomeMessage', event.target.value)} rows={3} maxLength={1000} />
              </FormField>
              <FormField label="Feedback form introduction">
                <Textarea value={form.feedbackIntro} onChange={(event) => set('feedbackIntro', event.target.value)} rows={3} maxLength={1000} />
              </FormField>
              <FormField label="Footer information">
                <Textarea value={form.footerText} onChange={(event) => set('footerText', event.target.value)} rows={2} maxLength={500} />
              </FormField>
            </div>
          </div>

          <div className="card p-5 sm:p-6">
            <h2 className="text-base font-bold text-ink">Official social links</h2>
            <p className="mt-1 text-xs text-muted">These links appear in the public footer. Enter full profile URLs.</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <FormField label="Instagram"><Input value={form.instagramUrl} onChange={(event) => set('instagramUrl', event.target.value)} placeholder="https://instagram.com/…" maxLength={250} /></FormField>
              <FormField label="TikTok"><Input value={form.tiktokUrl} onChange={(event) => set('tiktokUrl', event.target.value)} placeholder="https://tiktok.com/@…" maxLength={250} /></FormField>
              <FormField label="Facebook"><Input value={form.facebookUrl} onChange={(event) => set('facebookUrl', event.target.value)} placeholder="https://facebook.com/…" maxLength={250} /></FormField>
              <FormField label="YouTube"><Input value={form.youtubeUrl} onChange={(event) => set('youtubeUrl', event.target.value)} placeholder="https://youtube.com/@…" maxLength={250} /></FormField>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="card p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand">
              <Church className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-sm font-bold text-ink">Live across the portal</h3>
            <p className="mt-2 text-[13px] leading-relaxed text-muted">
              Saving these details updates the public website, the feedback form and every PDF report immediately — no code changes needed.
            </p>
            <Button type="submit" className="mt-5 w-full" loading={saving || uploading} icon={<Save className="h-4 w-4" />}>
              Save changes
            </Button>
          </div>
          <div className="rounded-xl border border-gold/30 bg-gold/5 p-4 text-[13px] leading-relaxed text-muted">
            <span className="font-semibold text-ink">Tip:</span> upload a clear, square logo image for the best results in the header and reports.
          </div>
        </div>
      </form>
    </div>
  );
};
