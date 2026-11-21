import { Eye, ImagePlus, Pencil, Plus, Trash2, UserCheck, UserX, Users } from 'lucide-react';
import { useCallback, useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/admin/PageHeader';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageLoader } from '../../components/ui/Feedback';
import { FormField, Input, Select, Textarea } from '../../components/ui/FormFields';
import { Modal } from '../../components/ui/Modal';
import { RatingDisplay } from '../../components/ui/Rating';
import { StatusBadge } from '../../components/ui/Badge';
import { api, errorMessage } from '../../lib/api';
import { useToast } from '../../lib/toast';
import type { StaffMember } from '../../types';

type StaffForm = {
  fullName: string;
  position: string;
  ministry: string;
  bio: string;
  status: 'active' | 'inactive';
  photoUrl: string | null;
};

const emptyForm: StaffForm = {
  fullName: '',
  position: '',
  ministry: '',
  bio: '',
  status: 'active',
  photoUrl: null,
};

export const StaffPage = () => {
  const { notify } = useToast();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<StaffMember | null>(null);
  const [form, setForm] = useState<StaffForm>(emptyForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<StaffMember | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await api<{ staff: StaffMember[] }>('/staff');
      setStaff(result.staff);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormErrors({});
    setModalOpen(true);
  };

  const openEdit = (member: StaffMember) => {
    setEditing(member);
    setForm({
      fullName: member.full_name,
      position: member.position,
      ministry: member.ministry,
      bio: member.bio,
      status: member.status,
      photoUrl: member.photo_url,
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const handlePhoto = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const data = new FormData();
      data.append('image', file);
      const result = await api<{ url: string }>('/uploads/image', { method: 'POST', body: data });
      setForm((current) => ({ ...current, photoUrl: result.url }));
      notify('Photo uploaded.', 'success');
    } catch (caught) {
      notify(errorMessage(caught), 'error');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
    if (saving || uploading) return;
    if (form.fullName.trim().length < 2) {
      setFormErrors({ fullName: 'Enter the staff member’s full name.' });
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form, fullName: form.fullName.trim() };
      if (editing) {
        await api(`/staff/${editing.id}`, { method: 'PUT', body: JSON.stringify(payload) });
        notify('Staff member updated.', 'success');
      } else {
        await api('/staff', { method: 'POST', body: JSON.stringify(payload) });
        notify('Staff member added and made available in the public form.', 'success');
      }
      setModalOpen(false);
      await load();
    } catch (caught) {
      notify(errorMessage(caught), 'error');
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (member: StaffMember) => {
    setBusy(true);
    try {
      const status = member.status === 'active' ? 'inactive' : 'active';
      await api(`/staff/${member.id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
      notify(status === 'active' ? 'Staff member is now active and visible in the public form.' : 'Staff member deactivated.', 'success');
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
      await api(`/staff/${deleting.id}`, { method: 'DELETE' });
      notify('Staff member removed. Their past reviews remain in the records.', 'success');
      setDeleting(null);
      await load();
    } catch (caught) {
      notify(errorMessage(caught), 'error');
    } finally {
      setBusy(false);
    }
  };

  const activeCount = staff.filter((member) => member.status === 'active').length;

  return (
    <div>
      <PageHeader
        title="Staff"
        description="Manage the ministry team available for feedback."
        actions={<Button onClick={openAdd} icon={<Plus className="h-4 w-4" />}>Add staff member</Button>}
      />

      <div className="mb-5 flex flex-wrap items-center gap-3 text-sm text-muted">
        <span className="chip bg-white text-ink shadow-sm">{staff.length} total</span>
        <span className="chip bg-emerald-50 text-emerald-700">{activeCount} active</span>
        <span className="chip bg-soft text-muted">{staff.length - activeCount} inactive</span>
      </div>

      {error && <div className="card mb-5 border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      {loading && !staff.length ? (
        <PageLoader />
      ) : !staff.length ? (
        <div className="card">
          <EmptyState
            icon={Users}
            title="No staff members have been added yet"
            description="Add your ministry team to make them available for reviews in the public feedback form."
            action={<Button onClick={openAdd} icon={<Plus className="h-4 w-4" />}>Add your first staff member</Button>}
          />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {staff.map((member) => (
            <div key={member.id} className="card hover-lift flex flex-col p-5">
              <div className="flex items-start gap-4">
                <Avatar name={member.full_name} src={member.photo_url} size="lg" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h3 className="text-base font-bold leading-tight text-ink">{member.full_name}</h3>
                    <StatusBadge status={member.status} />
                  </div>
                  <p className="mt-1 text-[13px] font-medium text-brand">{member.position || 'Ministry team'}</p>
                  {member.ministry && <p className="mt-0.5 text-xs text-muted">{member.ministry}</p>}
                </div>
              </div>

              {member.bio && <p className="mt-4 line-clamp-2 text-[13px] leading-relaxed text-muted">{member.bio}</p>}

              <div className="mt-4 flex items-center gap-4 rounded-xl bg-soft px-3.5 py-3">
                <div>
                  <p className="text-[11px] text-muted">Reviews</p>
                  <p className="text-sm font-bold text-ink">{member.total_reviews ?? 0}</p>
                </div>
                <div className="h-8 w-px bg-line" />
                <div>
                  <p className="text-[11px] text-muted">Average</p>
                  <p className="text-sm font-bold text-ink">{member.average_rating ? member.average_rating.toFixed(1) : '—'}</p>
                </div>
                <div className="ml-auto"><RatingDisplay value={Math.round(member.average_rating ?? 0)} size="sm" /></div>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-1 border-t border-line pt-4">
                <Link
                  to={`/admin/staff/${member.id}`}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-[13px] font-semibold text-brand hover:bg-brand-soft"
                >
                  <Eye className="h-4 w-4" /> View
                </Link>
                <button type="button" onClick={() => openEdit(member)} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-[13px] font-semibold text-muted hover:bg-soft hover:text-ink">
                  <Pencil className="h-4 w-4" /> Edit
                </button>
                <button
                  type="button"
                  onClick={() => void toggleStatus(member)}
                  disabled={busy}
                  className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-[13px] font-semibold text-muted hover:bg-soft hover:text-ink disabled:opacity-40"
                >
                  {member.status === 'active' ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                  {member.status === 'active' ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  type="button"
                  onClick={() => setDeleting(member)}
                  className="rounded-lg p-2 text-muted hover:bg-red-50 hover:text-red-600"
                  aria-label={`Delete ${member.full_name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit staff member' : 'Add staff member'}
        description="Active staff members appear in the public feedback form."
        size="md"
      >
        <form onSubmit={(event) => void handleSave(event)} className="space-y-5">
          <div className="flex items-center gap-4 rounded-xl bg-soft p-4">
            <Avatar name={form.fullName || 'New staff'} src={form.photoUrl} size="lg" />
            <div>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-line bg-white px-3 py-2 text-[13px] font-semibold text-ink hover:border-brand/40">
                <ImagePlus className="h-4 w-4 text-brand" />
                {uploading ? 'Uploading…' : form.photoUrl ? 'Change photo' : 'Upload photo'}
                <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={(event) => void handlePhoto(event)} disabled={uploading} />
              </label>
              {form.photoUrl && (
                <button type="button" onClick={() => setForm((current) => ({ ...current, photoUrl: null }))} className="ml-3 text-xs font-semibold text-muted hover:text-red-600">
                  Remove
                </button>
              )}
              <p className="mt-1.5 text-[11px] text-muted">JPG, PNG or WEBP · max 3MB</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Full name" required error={formErrors.fullName}>
              <Input value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} placeholder="e.g. Rev. Daniel Mwangi" maxLength={120} />
            </FormField>
            <FormField label="Position / role">
              <Input value={form.position} onChange={(event) => setForm({ ...form, position: event.target.value })} placeholder="e.g. Senior Pastor" maxLength={120} />
            </FormField>
            <FormField label="Department / ministry">
              <Input value={form.ministry} onChange={(event) => setForm({ ...form, ministry: event.target.value })} placeholder="e.g. Word / Preaching" maxLength={120} />
            </FormField>
            <FormField label="Status">
              <Select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as StaffForm['status'] })}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Select>
            </FormField>
          </div>

          <FormField label="Short biography">
            <Textarea value={form.bio} onChange={(event) => setForm({ ...form, bio: event.target.value })} placeholder="A brief introduction for the church community…" maxLength={1000} rows={3} />
          </FormField>

          <div className="flex justify-end gap-2 border-t border-line pt-5">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={saving || uploading}>{editing ? 'Save changes' : 'Add staff member'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => void confirmDelete()}
        title={`Remove ${deleting?.full_name ?? 'staff member'}?`}
        message="This person will be removed from the staff list and the public form. Their historical reviews will be preserved and still attributed to them in reports."
        confirmLabel="Remove staff member"
        loading={busy}
      />
    </div>
  );
};
