import { CalendarRange, Download, FileBarChart, FileSpreadsheet, FileText, UserCheck, Users } from 'lucide-react';
import { useEffect, useState, type ComponentType } from 'react';
import { PageHeader } from '../../components/admin/PageHeader';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { FormField, Input, Select } from '../../components/ui/FormFields';
import { api, downloadFile, errorMessage, toQuery } from '../../lib/api';
import { useToast } from '../../lib/toast';
import { cn, CATEGORIES } from '../../lib/utils';
import type { StaffMember } from '../../types';

const reportTypes: { id: string; title: string; description: string; icon: ComponentType<{ className?: string }> }[] = [
  { id: 'all', title: 'All reviews', description: 'Every submission in the records', icon: FileText },
  { id: 'staff', title: 'Reviews by staff member', description: 'Feedback for one leader', icon: Users },
  { id: 'monthly', title: 'Monthly reviews', description: 'A chosen calendar month', icon: CalendarRange },
  { id: 'custom', title: 'Custom date range', description: 'Any period you choose', icon: CalendarRange },
  { id: 'staff-summary', title: 'Staff rating summary', description: 'Performance at a glance', icon: FileBarChart },
  { id: 'church-summary', title: 'Church feedback summary', description: 'Overall ministry health', icon: FileSpreadsheet },
  { id: 'registrations', title: 'Registered people', description: 'Freshers registration list', icon: UserCheck },
];

interface Preview {
  total: number;
  average?: number;
  periodLabel: string;
  title: string;
  categories?: number;
  staff?: number;
  students?: number;
}

const thisMonth = new Date().toISOString().slice(0, 7);

export const ReportsPage = () => {
  const { notify } = useToast();
  const [type, setType] = useState('all');
  const [staffId, setStaffId] = useState('');
  const [category, setCategory] = useState('');
  const [month, setMonth] = useState(thisMonth);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    void api<{ staff: StaffMember[] }>('/staff')
      .then((result) => setStaff(result.staff))
      .catch(() => setStaff([]));
  }, []);

  const query = toQuery({
    type,
    staffId: type === 'staff' ? staffId : undefined,
    category: ['all', 'staff', 'monthly', 'custom'].includes(type) ? category : undefined,
    month: type === 'monthly' ? month : undefined,
    dateFrom: type === 'custom' ? dateFrom : undefined,
    dateTo: type === 'custom' ? dateTo : undefined,
  });
  const registrationQuery = toQuery({ dateFrom, dateTo });

  useEffect(() => {
    if ((type === 'staff' && !staffId) || (type === 'custom' && (!dateFrom || !dateTo))) {
      setPreview(null);
      return;
    }
    setLoading(true);
    setError('');
    const timer = window.setTimeout(() => {
      const endpoint = type === 'registrations' ? '/reports/registrations/preview' : '/reports/preview';
      void api<Preview>(`${endpoint}${type === 'registrations' ? registrationQuery : query}`)
        .then(setPreview)
        .catch((caught) => setError(errorMessage(caught)))
        .finally(() => setLoading(false));
    }, 200);
    return () => window.clearTimeout(timer);
  }, [query, registrationQuery, type, staffId, dateFrom, dateTo]);

  const needsSelection = (type === 'staff' && !staffId) || (type === 'custom' && (!dateFrom || !dateTo));

  const handleExport = async () => {
    setExporting(true);
    try {
      const endpoint = type === 'registrations' ? '/reports/registrations/pdf' : '/reports/pdf';
      await downloadFile(`${endpoint}${type === 'registrations' ? registrationQuery : query}`);
      notify('Your PDF report is ready.', 'success');
    } catch (caught) {
      notify(errorMessage(caught), 'error');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div>
      <PageHeader title="Reports" description="Export professional PDF reports built from your current selection." />

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="card p-5 sm:p-6">
            <h2 className="text-base font-bold text-ink">Choose a report</h2>
            <p className="mt-1 text-xs text-muted">Each report includes branding, summaries, distributions and written reviews where applicable.</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {reportTypes.map((report) => {
                const Icon = report.icon;
                const active = report.id === type;
                return (
                  <button
                    type="button"
                    key={report.id}
                    onClick={() => setType(report.id)}
                    className={cn(
                      'flex items-start gap-3 rounded-xl border p-4 text-left transition-colors',
                      active ? 'border-brand bg-brand-soft/60 ring-1 ring-brand/20' : 'border-line hover:border-brand/30 hover:bg-soft/40',
                    )}
                  >
                    <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', active ? 'bg-brand text-white' : 'bg-soft text-muted')}>
                      <Icon className="h-[18px] w-[18px]" />
                    </div>
                    <div>
                      <p className="text-[13px] font-bold text-ink">{report.title}</p>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-muted">{report.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="card mt-5 p-5 sm:p-6">
            <h2 className="text-base font-bold text-ink">Refine selection</h2>
            <p className="mt-1 text-xs text-muted">These options are applied to the exported PDF and the preview.</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {type === 'staff' && (
                <FormField label="Staff member" required>
                  <Select value={staffId} onChange={(event) => setStaffId(event.target.value)}>
                    <option value="">Select a staff member</option>
                    {staff.map((member) => (
                      <option key={member.id} value={member.id}>{member.full_name}</option>
                    ))}
                  </Select>
                </FormField>
              )}
              {type === 'monthly' && (
                <FormField label="Reporting month">
                  <Input type="month" value={month} onChange={(event) => setMonth(event.target.value)} />
                </FormField>
              )}
              {(type === 'custom' || type === 'registrations') && (
                <>
                  <FormField label={type === 'registrations' ? 'Registered from' : 'Start date'}>
                    <Input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
                  </FormField>
                  <FormField label={type === 'registrations' ? 'Registered to' : 'End date'}>
                    <Input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
                  </FormField>
                </>
              )}
              {['all', 'staff', 'monthly', 'custom'].includes(type) && (
                <FormField label="Feedback category">
                  <Select value={category} onChange={(event) => setCategory(event.target.value)}>
                    <option value="">All categories</option>
                    {CATEGORIES.map((item) => <option key={item} value={item}>{item}</option>)}
                  </Select>
                </FormField>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="card overflow-hidden">
            <div className="border-b border-line px-5 py-5">
              <h2 className="text-base font-bold text-ink">Report preview</h2>
              <p className="mt-1 text-xs text-muted">Based on the current selection</p>
            </div>
            {loading ? (
              <div className="px-5 py-10 text-center text-sm text-muted">Preparing preview…</div>
            ) : error ? (
              <div className="px-5 py-10 text-center text-sm text-red-600">{error}</div>
            ) : needsSelection ? (
              <EmptyState icon={CalendarRange} title="Complete the selection" description="Choose the required options to see a report preview." compact />
            ) : preview && preview.total > 0 ? (
              <div className="p-5">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-brand">{preview.title}</p>
                <p className="mt-2 text-sm font-semibold text-ink">{preview.periodLabel}</p>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  {type === 'registrations'
                    ? [
                        { label: 'Registered', value: String(preview.total) },
                        { label: 'Students', value: String(preview.students ?? 0) },
                      ].map((item) => (
                        <div key={item.label} className="rounded-xl bg-soft p-3.5">
                          <p className="text-[11px] text-muted">{item.label}</p>
                          <p className="mt-1 text-xl font-bold text-ink">{item.value}</p>
                        </div>
                      ))
                    : [
                        { label: 'Reviews', value: String(preview.total) },
                        { label: 'Average', value: preview.average ? preview.average.toFixed(1) : '—' },
                        { label: 'Categories', value: String(preview.categories ?? 0) },
                        { label: 'Staff rated', value: String(preview.staff ?? 0) },
                      ].map((item) => (
                        <div key={item.label} className="rounded-xl bg-soft p-3.5">
                          <p className="text-[11px] text-muted">{item.label}</p>
                          <p className="mt-1 text-xl font-bold text-ink">{item.value}</p>
                        </div>
                      ))}
                </div>
                <div className="mt-5 rounded-xl border border-brand/20 bg-brand-soft/50 p-3.5 text-[12px] leading-relaxed text-brand">
                  {type === 'registrations'
                    ? 'The PDF will include the church logo, reporting period, totals, every registrant’s contact details and their comments, with page numbers.'
                    : 'The PDF will include the church logo, summary statistics, rating distribution, staff and category summaries, and written reviews.'}
                </div>
              </div>
            ) : (
              <EmptyState
                icon={FileText}
                title="No reviews in this selection"
                description="Try a different period, category or staff member."
                compact
              />
            )}
            <div className="border-t border-line p-5">
              <Button className="w-full" size="lg" onClick={() => void handleExport()} loading={exporting} disabled={needsSelection} icon={<Download className="h-4 w-4" />}>
                Export PDF
              </Button>
              <p className="mt-3 text-center text-[11px] leading-relaxed text-muted">
                Reports are generated with your church branding and page numbers.
              </p>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="text-sm font-bold text-ink">What's included</h3>
            <ul className="mt-3 space-y-2 text-[13px] text-muted">
              {(type === 'registrations'
                ? ['Church logo and name', 'Reporting period and date', 'Total registered and student count', 'Full contact details for every registrant', 'Comments and page numbers']
                : ['Church logo and name', 'Reporting period and date', 'Totals and average rating', 'Rating distribution chart', 'Staff and category summaries', 'Written reviews and page numbers']
              ).map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
