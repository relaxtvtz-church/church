import { ArrowDown, CheckCircle2, Clock3, HeartHandshake, LockKeyhole, MapPin, Phone, Send } from 'lucide-react';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { FindUsSection } from '../../components/public/FindUsSection';
import { JoinUsSection } from '../../components/public/JoinUsSection';
import { ShushoSpotlight } from '../../components/public/ShushoSpotlight';
import { StaffSection } from '../../components/public/StaffSection';
import { StarRatingInput } from '../../components/public/StarRatingInput';
import { ChurchLogo } from '../../components/brand/ChurchLogo';
import { Button } from '../../components/ui/Button';
import { FormField, Input, Select, Textarea } from '../../components/ui/FormFields';
import { api, errorMessage } from '../../lib/api';
import { useSettings } from '../../lib/settings';
import { useToast } from '../../lib/toast';
import { CATEGORIES } from '../../lib/utils';
import type { PublicAdvertisement, PublicStaff } from '../../types';

type FormValues = {
  reviewerName: string;
  phone: string;
  staffId: string;
  category: string;
  rating: number;
  message: string;
};

type FormErrors = Partial<Record<keyof FormValues, string>>;

const emptyForm: FormValues = { reviewerName: '', phone: '', staffId: '', category: '', rating: 0, message: '' };

const validate = (values: FormValues): FormErrors => {
  const errors: FormErrors = {};
  if (!values.category) errors.category = 'Please select a feedback category.';
  if (!values.rating) errors.rating = 'Please choose a rating.';
  if (values.message.trim().length < 10) errors.message = 'Please write at least 10 characters so we can understand your feedback.';
  if (values.reviewerName.length > 120) errors.reviewerName = 'Name is too long.';
  return errors;
};

export const HomePage = () => {
  const { settings } = useSettings();
  const { notify } = useToast();
  const [staff, setStaff] = useState<PublicStaff[]>([]);
  const [advertisement, setAdvertisement] = useState<PublicAdvertisement | null>(null);
  const [values, setValues] = useState<FormValues>(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const loadPublicData = useCallback(() => {
    void api<{ staff: PublicStaff[] }>('/staff/public')
      .then((data) => setStaff(data.staff))
      .catch(() => setStaff([]));
    void api<PublicAdvertisement>('/advertisement/public')
      .then(setAdvertisement)
      .catch(() => setAdvertisement(null));
  }, []);

  useEffect(() => {
    loadPublicData();
    const onVisibility = () => {
      if (!document.hidden) loadPublicData();
    };
    window.addEventListener('focus', loadPublicData);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('focus', loadPublicData);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [loadPublicData]);

  const update = <K extends keyof FormValues>(key: K, value: FormValues[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting) return;

    const nextErrors = validate(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      notify('Please check the highlighted fields.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const response = await api<{ message: string }>('/reviews', {
        method: 'POST',
        body: JSON.stringify({
          reviewerName: values.reviewerName.trim() || null,
          phone: values.phone.trim() || null,
          staffId: values.staffId ? Number(values.staffId) : null,
          category: values.category,
          rating: values.rating,
          message: values.message.trim(),
        }),
      });
      notify(response.message, 'success');
      setSubmitted(true);
      setValues(emptyForm);
      setErrors({});
    } catch (error) {
      notify(errorMessage(error), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const scrollToForm = () => document.getElementById('feedback')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const scrollToFreshers = () => document.getElementById('freshers')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <>
      <section className="relative overflow-hidden border-b border-line bg-soft">
        <div className="pointer-events-none absolute -right-32 -top-40 h-[420px] w-[420px] rounded-full bg-brand/8 blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-brand/20 bg-white px-3 py-1.5 text-xs font-semibold text-brand">
              <span className="h-1.5 w-1.5 rounded-full bg-brand" />
              Official Ministry Portal
            </div>
            <h1 className="animate-fade-up text-4xl font-bold leading-[1.1] tracking-tight text-ink sm:text-5xl lg:text-6xl">
              Your Voice <span className="text-brand">Matters.</span>
            </h1>
            <p className="animate-fade-up mt-6 max-w-2xl text-base leading-relaxed text-muted sm:text-lg" style={{ animationDelay: '90ms' }}>
              {settings.welcome_message}
            </p>
            <div className="animate-fade-up mt-8 flex flex-wrap items-center gap-4" style={{ animationDelay: '180ms' }}>
              <Button size="lg" onClick={scrollToForm} icon={<ArrowDown className="h-4 w-4" />}>
                Share Your Experience
              </Button>
              <Button size="lg" variant="outline" onClick={scrollToFreshers} icon={<HeartHandshake className="h-4 w-4" />}>
                Join the Fellowship
              </Button>
            </div>
            <div className="mt-12 flex flex-wrap gap-x-8 gap-y-4 border-t border-line pt-6">
              {[
                { icon: LockKeyhole, label: 'Handled confidentially' },
                { icon: HeartHandshake, label: 'Reviewed by leadership' },
                { icon: Clock3, label: 'Always open' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2 text-[13px] font-medium text-muted">
                  <item.icon className="h-4 w-4 text-brand" />
                  {item.label}
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="animate-fade-up rounded-[26px] border border-line bg-white p-3 shadow-card" style={{ animationDelay: '140ms' }}>
              <div className="flex h-[380px] items-center justify-center overflow-hidden rounded-2xl bg-soft sm:h-[480px] lg:h-[560px]">
                <img
                  src={advertisement?.image_url ?? '/brand/church-banner.jpg'}
                  alt={`${settings.church_name} fellowship poster`}
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="px-2 pb-1 pt-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand">{settings.church_name}</p>
                <p className="mt-1.5 text-lg font-semibold leading-snug text-ink">
                  {settings.footer_text}
                </p>
              </div>
            </div>
            <div className="animate-pop mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white px-4 py-3 shadow-card">
              <ChurchLogo size="sm" subtitle="Official Ministry Portal" className="max-w-full" />
              <span className="chip hidden bg-brand-soft text-brand sm:inline-flex">Official ministry portal</span>
            </div>
          </div>
        </div>
      </section>

      <ShushoSpotlight />

      <section id="feedback" className="scroll-mt-16 bg-white py-16 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-5 lg:gap-10">
          <div className="lg:col-span-2">
            <div className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-brand">Your experience</div>
            <h2 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">Tell us how we're doing</h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-muted sm:text-base">{settings.feedback_intro}</p>

            <div className="mt-8 space-y-4 border-t border-line pt-6">
              {settings.location && (
                <div className="flex gap-3 text-sm text-muted">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                  <span>{settings.location}</span>
                </div>
              )}
              {settings.phone && (
                <div className="flex gap-3 text-sm text-muted">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                  <span>{settings.phone}</span>
                </div>
              )}
              {settings.service_info && (
                <div className="flex gap-3 text-sm text-muted">
                  <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                  <span>{settings.service_info}</span>
                </div>
              )}
            </div>
            <div className="mt-8 hidden rounded-2xl bg-soft p-5 lg:block">
              <p className="text-sm font-semibold text-ink">Your privacy matters</p>
              <p className="mt-2 text-[13px] leading-relaxed text-muted">
                Your name and phone number are optional. Feedback is only visible to authorised church administrators.
              </p>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="card animate-fade-up overflow-hidden" style={{ animationDelay: '220ms' }}>
              {submitted ? (
                <div className="animate-pop flex flex-col items-center px-6 py-14 text-center sm:px-10">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <h3 className="mt-6 text-2xl font-bold text-ink">Thank you for your feedback</h3>
                  <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted sm:text-base">
                    Thank you for sharing your experience with {settings.church_name}. Your feedback has been received and is appreciated.
                  </p>
                  <div className="mt-8 h-1 w-14 rounded-full bg-gold" />
                  <Button variant="outline" className="mt-8" onClick={() => setSubmitted(false)}>
                    Submit another response
                  </Button>
                </div>
              ) : (
                <form onSubmit={(event) => void handleSubmit(event)} noValidate className="p-5 sm:p-8">
                  <div className="mb-7 flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-bold text-ink">Share your experience</h3>
                      <p className="mt-1 text-sm text-muted">Fields marked * are required.</p>
                    </div>
                    <ChurchLogo compact size="sm" className="hidden sm:flex" />
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <FormField label="Full name" error={errors.reviewerName} hint="Optional — leave blank to stay anonymous">
                      <Input
                        value={values.reviewerName}
                        onChange={(event) => update('reviewerName', event.target.value)}
                        placeholder="Your name"
                        autoComplete="name"
                        maxLength={120}
                      />
                    </FormField>
                    <FormField label="Phone number" hint="Optional">
                      <Input
                        value={values.phone}
                        onChange={(event) => update('phone', event.target.value)}
                        placeholder="e.g. +255 700 000 000"
                        type="tel"
                        autoComplete="tel"
                        maxLength={40}
                      />
                    </FormField>
                  </div>

                  <div className="mt-5 grid gap-5 sm:grid-cols-2">
                    <FormField label="Who would you like to review?" hint="Optional — choose general feedback if unsure">
                      <Select value={values.staffId} onChange={(event) => update('staffId', event.target.value)}>
                        <option value="">General church feedback</option>
                        {staff.some((member) => member.ministry === 'Department') && (
                          <optgroup label="Ministry departments">
                            {staff.filter((member) => member.ministry === 'Department').map((member) => (
                              <option key={member.id} value={member.id}>{member.full_name}</option>
                            ))}
                          </optgroup>
                        )}
                        {staff.some((member) => member.ministry !== 'Department') && (
                          <optgroup label="Team members">
                            {staff.filter((member) => member.ministry !== 'Department').map((member) => (
                              <option key={member.id} value={member.id}>
                                {member.full_name}{member.position ? ` — ${member.position}` : ''}
                              </option>
                            ))}
                          </optgroup>
                        )}
                      </Select>
                    </FormField>
                    <FormField label="Category" required error={errors.category}>
                      <Select value={values.category} onChange={(event) => update('category', event.target.value)} aria-invalid={!!errors.category}>
                        <option value="">Select a category</option>
                        {CATEGORIES.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </Select>
                    </FormField>
                  </div>

                  <div className="mt-6">
                    <label className="label">Your rating <span className="text-brand">*</span></label>
                    <StarRatingInput value={values.rating} onChange={(rating) => update('rating', rating)} error={errors.rating} />
                  </div>

                  <div className="mt-6">
                    <FormField label="Your feedback" required error={errors.message}>
                      <Textarea
                        value={values.message}
                        onChange={(event) => update('message', event.target.value)}
                        placeholder="Tell us about your experience, what went well, and how we can serve better…"
                        maxLength={3000}
                        rows={5}
                        aria-invalid={!!errors.message}
                      />
                    </FormField>
                    <p className="mt-1 text-right text-[11px] text-muted">{values.message.length}/3000</p>
                  </div>

                  <Button type="submit" size="lg" className="mt-6 w-full" loading={submitting} icon={<Send className="h-4 w-4" />}>
                    Submit Review
                  </Button>
                  <p className="mt-4 text-center text-xs leading-relaxed text-muted">
                    Your feedback is shared only with authorised ministry administrators.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      <StaffSection staff={staff} />
      <FindUsSection settings={settings} />
      <JoinUsSection advertisement={advertisement} churchName={settings.church_name} />
    </>
  );
};
