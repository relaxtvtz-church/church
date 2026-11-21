import { ArrowLeft, Eye, EyeOff, LockKeyhole, ShieldCheck } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ChurchLogo } from '../../components/brand/ChurchLogo';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/FormFields';
import { useAuth } from '../../lib/auth';
import { errorMessage } from '../../lib/api';
import { useToast } from '../../lib/toast';

export const LoginPage = () => {
  const { admin, loading, login } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!loading && admin) return <Navigate to="/admin" replace />;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    setError('');
    setSubmitting(true);
    try {
      await login(identifier.trim(), password, remember);
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from && from.startsWith('/admin') ? from : '/admin', { replace: true });
      notify('Welcome back to the admin portal.', 'success');
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      <div className="relative hidden w-[42%] flex-col justify-between overflow-hidden bg-brand px-12 py-12 text-white lg:flex">
        <div className="pointer-events-none absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-white/8" />
        <div className="pointer-events-none absolute -right-24 top-20 h-72 w-72 rounded-full bg-gold/15" />
        <div className="relative">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15">
            <LockKeyhole className="h-6 w-6" />
          </div>
          <h1 className="mt-10 text-4xl font-bold leading-tight tracking-tight">
            Private admin
            <br />
            portal.
          </h1>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/80">
            A quiet, simple space for ministry leadership to review feedback, care for the team, and prepare reports.
          </p>
        </div>
        <div className="relative">
          <div className="mb-8 h-px w-16 bg-gold" />
          <p className="max-w-sm text-sm leading-relaxed text-white/80">
            “Whatever you do, work at it with all your heart, as working for the Lord.”
          </p>
          <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-white/60">Colossians 3:23</p>
        </div>
      </div>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-line px-5 py-4 sm:px-8">
          <Link to="/" className="min-w-0 flex-1 rounded-lg pr-3 sm:pr-6">
            <ChurchLogo subtitle="Ministry Feedback & Staff Review" size="sm" className="w-full" />
          </Link>
          <Link to="/" className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-muted hover:text-ink">
            <ArrowLeft className="h-4 w-4" />
            Back to website
          </Link>
        </header>

        <div className="flex flex-1 items-center justify-center px-5 py-12 sm:px-8">
          <div className="w-full max-w-sm">
            <div className="mb-8">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-soft text-brand lg:hidden">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-ink">Sign in</h2>
              <p className="mt-2 text-sm text-muted">Use your administrator credentials to continue.</p>
            </div>

            <form onSubmit={(event) => void handleSubmit(event)} className="space-y-5" noValidate>
              <div>
                <label htmlFor="identifier" className="label">Email or username</label>
                <Input
                  id="identifier"
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  placeholder="shorahgodfrey@gmail.com"
                  autoComplete="username"
                  required
                />
              </div>
              <div>
                <label htmlFor="password" className="label">Password</label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className="pr-11"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-muted hover:text-ink"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <label className="flex cursor-pointer items-center gap-2 text-[13px] text-muted">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(event) => setRemember(event.target.checked)}
                    className="h-4 w-4 rounded border-line accent-brand"
                  />
                  Remember me
                </label>
                <span className="text-xs text-muted">Authorised access only</span>
              </div>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700" role="alert">
                  {error}
                </div>
              )}

              <Button type="submit" size="lg" className="w-full" loading={submitting}>
                Sign in to dashboard
              </Button>
            </form>

            <p className="mt-8 text-center text-xs leading-relaxed text-muted">
              This area is private. All activity is limited to authorised church administrators.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
