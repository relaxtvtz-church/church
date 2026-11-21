import { CheckCircle2, GraduationCap, Send, UserRound, Users, MapPin } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Button } from '../ui/Button';
import { FormField, Input, Select, Textarea } from '../ui/FormFields';
import { api, errorMessage } from '../../lib/api';
import { useToast } from '../../lib/toast';
import type { PublicAdvertisement } from '../../types';

type FormValues = {
  fullName: string;
  parentName: string;
  email: string;
  phone: string;
  guardianPhone: string;
  location: string;
  status: string;
  studyingAt: string;
  university: string;
  comments: string;
};

type FormErrors = Partial<Record<keyof FormValues, string>>;

const emptyForm: FormValues = {
  fullName: '',
  parentName: '',
  email: '',
  phone: '',
  guardianPhone: '',
  location: '',
  status: '',
  studyingAt: '',
  university: '',
  comments: '',
};

const STATUSES = ['Student', 'Employed', 'Self-employed', 'Unemployed', 'Other'] as const;

const validate = (values: FormValues): FormErrors => {
  const errors: FormErrors = {};
  if (values.fullName.trim().length < 2) errors.fullName = 'Enter your full name.';
  if (values.parentName.trim().length < 2) errors.parentName = "Enter your parent's or guardian's name.";
  if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) errors.email = 'Enter a valid email address.';
  if (values.phone.replace(/\D/g, '').length < 7) errors.phone = 'Enter your phone number.';
  if (values.guardianPhone.replace(/\D/g, '').length < 7) errors.guardianPhone = "Enter your parent's or guardian's phone number.";
  if (values.location.trim().length < 2) errors.location = 'Enter where you live.';
  if (!values.status) errors.status = 'Choose your current status.';
  if (values.status === 'Student' && values.studyingAt.trim().length < 2) {
    errors.studyingAt = 'Tell us where you are studying.';
  }
  if (values.comments.length > 2000) errors.comments = 'Comments are too long.';
  return errors;
};

interface JoinUsSectionProps {
  advertisement: PublicAdvertisement | null;
  churchName: string;
}

export const JoinUsSection = ({ advertisement, churchName }: JoinUsSectionProps) => {
  const { notify } = useToast();
  const [values, setValues] = useState<FormValues>(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!advertisement || !advertisement.is_active) return null;

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
      const response = await api<{ message: string }>('/registrations', {
        method: 'POST',
        body: JSON.stringify({
          fullName: values.fullName.trim(),
          parentName: values.parentName.trim(),
          email: values.email.trim(),
          phone: values.phone.trim(),
          guardianPhone: values.guardianPhone.trim(),
          location: values.location.trim(),
          status: values.status,
          studyingAt: values.studyingAt.trim(),
          university: values.university.trim(),
          comments: values.comments.trim(),
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

  const poster = advertisement.image_url ?? '/brand/church-banner.jpg';

  return (
    <section id="freshers" className="scroll-mt-16 border-t border-line bg-soft/60 py-16 sm:py-20">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-12">
        <div className="animate-fade-up">
          <div className="card overflow-hidden p-3">
            <div className="flex h-[400px] items-center justify-center overflow-hidden rounded-2xl bg-soft sm:h-[520px]">
              <img
                src={poster}
                alt={`${churchName} registration poster`}
                className="h-full w-full object-contain"
              />
            </div>
            <div className="flex items-center gap-2 px-2 pb-1 pt-4 text-xs font-semibold text-brand">
              <Users className="h-4 w-4" />
              Official fellowship poster · shown in full
            </div>
          </div>
        </div>

        <div className="animate-fade-up" style={{ animationDelay: '100ms' }}>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-white px-3 py-1.5 text-xs font-semibold text-brand">
            <span className="h-1.5 w-1.5 rounded-full bg-gold" />
            Freshers registration
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">{advertisement.title}</h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">{advertisement.description}</p>

          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-gold/30 bg-gold/5 p-4">
            <GraduationCap className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">University / Where you're from</p>
              <p className="mt-1 text-sm font-semibold leading-relaxed text-ink">
                {advertisement.university || 'Share your university or hometown in the registration form below.'}
              </p>
            </div>
          </div>

          <div className="card animate-fade-up mt-6 overflow-hidden" style={{ animationDelay: '180ms' }}>
            {submitted ? (
              <div className="animate-pop flex flex-col items-center px-6 py-12 text-center sm:px-10">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h3 className="mt-6 text-2xl font-bold text-ink">You're registered</h3>
                <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted sm:text-base">
                  Thank you for your interest in {churchName}. Our leadership team will be in touch with you soon.
                </p>
                <Button variant="outline" className="mt-8" onClick={() => setSubmitted(false)}>
                  Register another person
                </Button>
              </div>
            ) : (
              <form onSubmit={(event) => void handleSubmit(event)} noValidate className="p-5 sm:p-7">
                <div className="mb-6 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-ink">Registration form</h3>
                    <p className="mt-1 text-sm text-muted">For everyone interested in joining the fellowship. Fields marked * are required.</p>
                  </div>
                  <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand sm:flex">
                    <UserRound className="h-5 w-5" />
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <FormField label="Your full name" required error={errors.fullName}>
                    <Input value={values.fullName} onChange={(event) => update('fullName', event.target.value)} placeholder="First and last name" autoComplete="name" maxLength={120} aria-invalid={!!errors.fullName} />
                  </FormField>
                  <FormField label="Parent's / guardian's name" required error={errors.parentName}>
                    <Input value={values.parentName} onChange={(event) => update('parentName', event.target.value)} placeholder="Parent or guardian" maxLength={120} aria-invalid={!!errors.parentName} />
                  </FormField>
                </div>

                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                  <FormField label="Your email" error={errors.email} hint="Optional — we can send updates here">
                    <Input type="email" value={values.email} onChange={(event) => update('email', event.target.value)} placeholder="you@example.com" autoComplete="email" maxLength={150} aria-invalid={!!errors.email} />
                  </FormField>
                  <FormField label="Your phone number" required error={errors.phone}>
                    <Input type="tel" value={values.phone} onChange={(event) => update('phone', event.target.value)} placeholder="+255 700 000 000" autoComplete="tel" maxLength={40} aria-invalid={!!errors.phone} />
                  </FormField>
                  <FormField label="Parent's / guardian's phone number" required error={errors.guardianPhone} className="sm:col-span-2">
                    <Input type="tel" value={values.guardianPhone} onChange={(event) => update('guardianPhone', event.target.value)} placeholder="+255 700 000 000" maxLength={40} aria-invalid={!!errors.guardianPhone} />
                  </FormField>
                </div>

                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                  <FormField label="Where you live" required error={errors.location}>
                    <Input value={values.location} onChange={(event) => update('location', event.target.value)} placeholder="Town, area or address" autoComplete="address-level2" maxLength={200} aria-invalid={!!errors.location} />
                  </FormField>
                  <FormField label="Current status" required error={errors.status}>
                    <Select value={values.status} onChange={(event) => update('status', event.target.value)} aria-invalid={!!errors.status}>
                      <option value="">Select your status</option>
                      {STATUSES.map((status) => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </Select>
                  </FormField>
                </div>

                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                  <FormField label="Where you are studying" hint="School, college or university" error={errors.studyingAt}>
                    <Input value={values.studyingAt} onChange={(event) => update('studyingAt', event.target.value)} placeholder="e.g. University of Dar es Salaam" maxLength={200} aria-invalid={!!errors.studyingAt} />
                  </FormField>
                  <FormField label="University / Where you're from" hint="Optional — tell us your background">
                    <Input value={values.university} onChange={(event) => update('university', event.target.value)} placeholder="University or hometown" maxLength={200} />
                  </FormField>
                </div>

                <div className="mt-5">
                  <FormField label="Comments" hint="Anything you would like us to know" error={errors.comments}>
                    <Textarea value={values.comments} onChange={(event) => update('comments', event.target.value)} placeholder="Share your questions, interests or anything else…" maxLength={2000} rows={4} aria-invalid={!!errors.comments} />
                  </FormField>
                  <p className="mt-1 text-right text-[11px] text-muted">{values.comments.length}/2000</p>
                </div>

                <Button type="submit" size="lg" className="mt-6 w-full" loading={submitting} icon={<Send className="h-4 w-4" />}>
                  {advertisement.cta_label || 'Register your interest'}
                </Button>
                <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-muted">
                  <MapPin className="h-3.5 w-3.5 text-brand" />
                  Your details are only visible to authorised ministry administrators.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
