import { KeyRound, LockKeyhole, ShieldCheck } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { PageHeader } from '../../components/admin/PageHeader';
import { Button } from '../../components/ui/Button';
import { FormField, Input } from '../../components/ui/FormFields';
import { useAuth } from '../../lib/auth';
import { errorMessage } from '../../lib/api';
import { useToast } from '../../lib/toast';

export const SettingsPage = () => {
  const { admin, changePassword } = useAuth();
  const { notify } = useToast();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }
    setSaving(true);
    try {
      await changePassword(currentPassword, newPassword);
      notify('Password updated. Please sign in again.', 'success');
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader title="Settings" description="Manage your administrator account and security." />

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="card p-5 sm:p-6 lg:col-span-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-ink">Change password</h2>
              <p className="mt-0.5 text-xs text-muted">Choose a strong password you don't use elsewhere.</p>
            </div>
          </div>

          <form onSubmit={(event) => void handleSubmit(event)} className="mt-6 max-w-md space-y-4">
            <FormField label="Current password">
              <Input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} autoComplete="current-password" required />
            </FormField>
            <FormField label="New password" hint="At least 8 characters">
              <Input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} autoComplete="new-password" required minLength={8} />
            </FormField>
            <FormField label="Confirm new password" error={error}>
              <Input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" required />
            </FormField>
            <Button type="submit" loading={saving}>Update password</Button>
          </form>
        </div>

        <div className="space-y-5">
          <div className="card p-5">
            <h3 className="text-sm font-bold text-ink">Signed in as</h3>
            <div className="mt-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ink text-sm font-bold text-white">
                {(admin?.name ?? 'A').slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink">{admin?.name}</p>
                <p className="truncate text-xs text-muted">{admin?.email}</p>
              </div>
            </div>
            <div className="mt-4 border-t border-line pt-4">
              <span className="chip bg-brand-soft capitalize text-brand"><ShieldCheck className="h-3 w-3" /> {admin?.role ?? 'admin'}</span>
            </div>
          </div>
          <div className="card p-5">
            <LockKeyhole className="h-5 w-5 text-brand" />
            <h3 className="mt-3 text-sm font-bold text-ink">Privacy reminder</h3>
            <p className="mt-2 text-[13px] leading-relaxed text-muted">
              Reviewer names and phone numbers are private. Only administrators can see feedback, and reports should be stored securely.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
