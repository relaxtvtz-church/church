import { Router, type Request } from 'express';
import { db } from '../../db/database.js';
import { requireAuth } from '../../middleware/auth.js';
import { asyncHandler, ApiError } from '../../utils/http.js';
import { formatDate } from '../../utils/format.js';
import { parseReviewFilters } from '../../utils/query.js';
import { cleanText } from '../../utils/sanitize.js';
import type { RegistrationRow } from '../advertise/registrations.routes.js';
import { getStaffRatings, listReviews, type ReviewFilters } from '../reviews/reviews.service.js';
import { buildRegistrationsPdf, buildReportPdf } from './pdf.js';

export const reportsRouter = Router();
reportsRouter.use(requireAuth);

const getSettings = async () =>
  (await db.prepare('SELECT church_name, logo_url, location, phone, email FROM church_settings WHERE id = 1').get()) as {
    church_name: string;
    logo_url: string | null;
    location: string | null;
    phone: string | null;
    email: string | null;
  };

const monthBounds = (month: string): { from: string; to: string } | null => {
  if (!/^\d{4}-\d{2}$/.test(month)) return null;
  const [year, number] = month.split('-').map(Number);
  if (number < 1 || number > 12) return null;
  const from = new Date(Date.UTC(year, number - 1, 1));
  const to = new Date(Date.UTC(year, number, 0, 23, 59, 59, 999));
  return { from: from.toISOString(), to: to.toISOString() };
};

const resolveReport = async (query: Request['query']) => {
  const type = typeof query.type === 'string' ? query.type : 'all';
  const filters = parseReviewFilters(query);
  let title = 'All Reviews Report';
  let periodLabel = 'All recorded submissions';
  let includeWrittenReviews = true;

  if (type === 'staff') {
    if (!filters.staffId || filters.staffId === -1) throw new ApiError(400, 'Select a staff member for this report.');
    const staff = (await db.prepare('SELECT full_name FROM staff WHERE id = ?').get(filters.staffId)) as
      | { full_name: string }
      | undefined;
    if (!staff) throw new ApiError(400, 'Selected staff member was not found.');
    title = `${staff.full_name} — Feedback Report`;
  } else if (type === 'monthly') {
    const month = typeof query.month === 'string' ? query.month : '';
    const bounds = monthBounds(month);
    if (!bounds) throw new ApiError(400, 'Select a valid month.');
    filters.dateFrom = bounds.from;
    filters.dateTo = bounds.to;
    title = 'Monthly Reviews Report';
    periodLabel = new Date(`${month}-01T00:00:00Z`).toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  } else if (type === 'custom') {
    if (!filters.dateFrom || !filters.dateTo) throw new ApiError(400, 'Select both a start and end date.');
    title = 'Custom Date Range Report';
    periodLabel = `${formatDate(filters.dateFrom)} – ${formatDate(filters.dateTo)}`;
  } else if (type === 'staff-summary') {
    title = 'Staff Rating Summary';
    periodLabel = filters.dateFrom || filters.dateTo ? `${formatDate(filters.dateFrom)} – ${formatDate(filters.dateTo)}` : 'All recorded submissions';
    includeWrittenReviews = false;
  } else if (type === 'church-summary') {
    title = 'Overall Church Feedback Summary';
    periodLabel = filters.dateFrom || filters.dateTo ? `${formatDate(filters.dateFrom)} – ${formatDate(filters.dateTo)}` : 'All recorded submissions';
    includeWrittenReviews = false;
  }

  const { rows: reviews } = await listReviews(filters);
  const distribution = [1, 2, 3, 4, 5].map((rating) => ({
    rating,
    count: reviews.filter((review) => Number(review.rating) === rating).length,
  }));
  const categories = [...new Set(reviews.map((review) => review.category))]
    .map((category) => {
      const matching = reviews.filter((review) => review.category === category);
      return {
        category,
        count: matching.length,
        average: Math.round((matching.reduce((sum, review) => sum + Number(review.rating), 0) / matching.length) * 10) / 10,
      };
    })
    .sort((a, b) => b.count - a.count);

  const allStaff = await getStaffRatings();
  const staffSummary = allStaff
    .map((staff) => {
      const matching = reviews.filter((review) => Number(review.staff_id) === Number(staff.id));
      return {
        full_name: staff.full_name,
        position: staff.position,
        total_reviews: matching.length,
        average_rating: matching.length
          ? Math.round((matching.reduce((sum, review) => sum + Number(review.rating), 0) / matching.length) * 10) / 10
          : null,
      };
    })
    .sort((a, b) => (b.average_rating ?? 0) - (a.average_rating ?? 0));

  const general = reviews.filter((review) => !review.staff_id);
  if (general.length) {
    staffSummary.push({
      full_name: 'General Church Feedback',
      position: 'Not attributed to an individual',
      total_reviews: general.length,
      average_rating:
        Math.round((general.reduce((sum, review) => sum + Number(review.rating), 0) / general.length) * 10) / 10,
    });
  }

  return { title, periodLabel, includeWrittenReviews, reviews, distribution, categories, staffSummary, filters };
};

const resolveRegistrations = async (query: Request['query']) => {
  const search = cleanText(typeof query.search === 'string' ? query.search : '', 120);
  const dateFrom = typeof query.dateFrom === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(query.dateFrom) ? query.dateFrom : '';
  const dateTo = typeof query.dateTo === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(query.dateTo) ? query.dateTo : '';

  const where: string[] = [];
  const params: Record<string, string> = {};
  if (search) {
    where.push(`(full_name LIKE @search OR parent_name LIKE @search OR email LIKE @search OR phone LIKE @search
      OR guardian_phone LIKE @search OR location LIKE @search OR studying_at LIKE @search
      OR university LIKE @search OR status LIKE @search)`);
    params.search = `%${search}%`;
  }
  if (dateFrom) {
    where.push('created_at >= @dateFrom');
    params.dateFrom = `${dateFrom}T00:00:00.000Z`;
  }
  if (dateTo) {
    where.push('created_at <= @dateTo');
    params.dateTo = `${dateTo}T23:59:59.999Z`;
  }

  const registrations = (await db
    .prepare(`SELECT * FROM registrations ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY created_at DESC`)
    .all(params)) as RegistrationRow[];

  const periodLabel =
    dateFrom || dateTo
      ? `${dateFrom ? formatDate(dateFrom) : 'Beginning'} – ${dateTo ? formatDate(dateTo) : 'Today'}`
      : 'All recorded registrations';

  return { registrations, search, periodLabel };
};

reportsRouter.get(
  '/registrations/preview',
  asyncHandler(async (req, res) => {
    const { registrations, periodLabel } = await resolveRegistrations(req.query);
    res.json({
      total: registrations.length,
      students: registrations.filter((item) => item.status === 'Student').length,
      periodLabel,
      title: 'Registered People Report',
    });
  }),
);

reportsRouter.get(
  '/registrations/pdf',
  asyncHandler(async (req, res) => {
    const { registrations, search, periodLabel } = await resolveRegistrations(req.query);
    const settings = await getSettings();
    const pdf = await buildRegistrationsPdf({
      settings,
      periodLabel,
      search,
      registrations,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="registered-people-${new Date().toISOString().slice(0, 10)}.pdf"`);
    res.setHeader('Cache-Control', 'no-store');
    res.send(pdf);
  }),
);

reportsRouter.get(
  '/preview',
  asyncHandler(async (req, res) => {
    const report = await resolveReport(req.query);
    res.json({
      total: report.reviews.length,
      average: report.reviews.length
        ? Math.round((report.reviews.reduce((sum, review) => sum + Number(review.rating), 0) / report.reviews.length) * 10) / 10
        : 0,
      periodLabel: report.periodLabel,
      title: report.title,
      categories: report.categories.length,
      staff: report.staffSummary.filter((item) => item.total_reviews > 0).length,
    });
  }),
);

reportsRouter.get(
  '/pdf',
  asyncHandler(async (req, res) => {
    const report = await resolveReport(req.query);
    const settings = await getSettings();
    const pdf = await buildReportPdf({
      title: report.title,
      subtitle: `${settings.church_name} — Ministry Feedback & Staff Review`,
      periodLabel: report.periodLabel,
      reviews: report.reviews,
      distribution: report.distribution,
      categories: report.categories,
      staffSummary: report.staffSummary,
      settings,
      includeWrittenReviews: report.includeWrittenReviews,
    });

    const filename = report.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 60);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}-${new Date().toISOString().slice(0, 10)}.pdf"`);
    res.setHeader('Cache-Control', 'no-store');
    res.send(pdf);
  }),
);
