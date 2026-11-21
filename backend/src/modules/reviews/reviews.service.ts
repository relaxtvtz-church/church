import { db } from '../../db/database.js';

export interface ReviewFilters {
  staffId?: number;
  category?: string;
  rating?: number;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface ReviewRow {
  id: number;
  reviewer_name: string | null;
  phone: string | null;
  staff_id: number | null;
  staff_name: string | null;
  category: string;
  rating: number;
  message: string;
  status: string;
  created_at: string;
  position?: string | null;
}

export const buildFilterClause = (filters: ReviewFilters, alias = 'r'): { clause: string; params: unknown[] } => {
  const parts: string[] = [];
  const params: unknown[] = [];

  if (filters.staffId) {
    if (filters.staffId === -1) parts.push(`${alias}.staff_id IS NULL`);
    else {
      parts.push(`${alias}.staff_id = ?`);
      params.push(filters.staffId);
    }
  }
  if (filters.category) {
    parts.push(`${alias}.category = ?`);
    params.push(filters.category);
  }
  if (filters.rating) {
    parts.push(`${alias}.rating = ?`);
    params.push(filters.rating);
  }
  if (filters.status) {
    parts.push(`${alias}.status = ?`);
    params.push(filters.status);
  }
  if (filters.dateFrom) {
    parts.push(`${alias}.created_at >= ?`);
    params.push(filters.dateFrom);
  }
  if (filters.dateTo) {
    parts.push(`${alias}.created_at <= ?`);
    params.push(filters.dateTo);
  }
  if (filters.search) {
    parts.push(`(LOWER(COALESCE(${alias}.reviewer_name, '')) LIKE ? OR LOWER(${alias}.message) LIKE ? OR LOWER(COALESCE(${alias}.staff_name, '')) LIKE ?)`);
    const term = `%${filters.search.toLowerCase()}%`;
    params.push(term, term, term);
  }

  return { clause: parts.length ? `WHERE ${parts.join(' AND ')}` : '', params };
};

export const listReviews = (
  filters: ReviewFilters,
  options: { page?: number; limit?: number } = {},
): { rows: ReviewRow[]; total: number } => {
  const { clause, params } = buildFilterClause(filters);
  const total = (
    db.prepare(`SELECT COUNT(*) AS count FROM reviews r ${clause}`).get(...params) as { count: number }
  ).count;

  let sql = `SELECT r.*, s.position FROM reviews r LEFT JOIN staff s ON s.id = r.staff_id ${clause} ORDER BY r.created_at DESC`;
  const queryParams = [...params];
  if (options.limit) {
    const page = Math.max(1, options.page ?? 1);
    sql += ' LIMIT ? OFFSET ?';
    queryParams.push(options.limit, (page - 1) * options.limit);
  }
  return { rows: db.prepare(sql).all(...queryParams) as ReviewRow[], total };
};

export const getReview = (id: number): ReviewRow | undefined =>
  db
    .prepare('SELECT r.*, s.position FROM reviews r LEFT JOIN staff s ON s.id = r.staff_id WHERE r.id = ?')
    .get(id) as ReviewRow | undefined;

export const getOverviewStats = () => {
  const totals = db
    .prepare(
      `SELECT COUNT(*) AS total,
              ROUND(AVG(CASE WHEN status != 'archived' THEN rating END), 1) AS average,
              SUM(CASE WHEN created_at >= ? THEN 1 ELSE 0 END) AS this_month
       FROM reviews`,
    )
    .get(new Date(new Date().setDate(1)).toISOString()) as {
    total: number;
    average: number | null;
    this_month: number | null;
  };

  const activeStaff = (
    db.prepare("SELECT COUNT(*) AS count FROM staff WHERE status = 'active'").get() as { count: number }
  ).count;

  const distribution = db
    .prepare('SELECT rating, COUNT(*) AS count FROM reviews WHERE status != ? GROUP BY rating ORDER BY rating')
    .all('archived') as { rating: number; count: number }[];
  const distMap = new Map(distribution.map((row) => [row.rating, row.count]));

  const monthLabels: string[] = [];
  const monthKeys: string[] = [];
  const today = new Date();
  for (let i = 11; i >= 0; i -= 1) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    monthKeys.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
    monthLabels.push(date.toLocaleDateString('en-GB', { month: 'short' }));
  }
  const monthlyRows = db
    .prepare("SELECT strftime('%Y-%m', created_at) AS month, COUNT(*) AS count FROM reviews GROUP BY month")
    .all() as { month: string; count: number }[];
  const monthlyMap = new Map(monthlyRows.map((row) => [row.month, row.count]));

  return {
    totalReviews: totals.total,
    averageRating: totals.average ?? 0,
    reviewsThisMonth: totals.this_month ?? 0,
    activeStaff,
    distribution: [1, 2, 3, 4, 5].map((rating) => ({ rating, count: distMap.get(rating) ?? 0 })),
    submissions: monthKeys.map((key, index) => ({
      month: monthLabels[index],
      count: monthlyMap.get(key) ?? 0,
    })),
  };
};

export const getStaffRatings = () =>
  db
    .prepare(
      `SELECT s.id, s.full_name, s.position, s.photo_url, s.status,
              COUNT(r.id) AS total_reviews,
              ROUND(AVG(r.rating), 1) AS average_rating
       FROM staff s
       LEFT JOIN reviews r ON r.staff_id = s.id AND r.status != 'archived'
       GROUP BY s.id
       ORDER BY average_rating DESC, total_reviews DESC, s.full_name ASC`,
    )
    .all() as {
    id: number;
    full_name: string;
    position: string;
    photo_url: string | null;
    status: string;
    total_reviews: number;
    average_rating: number | null;
  }[];

export const getGeneralFeedbackStats = () =>
  db
    .prepare(
      `SELECT COUNT(*) AS total_reviews, ROUND(AVG(rating), 1) AS average_rating
       FROM reviews WHERE staff_id IS NULL AND status != 'archived'`,
    )
    .get() as { total_reviews: number; average_rating: number | null };

export const getCategorySummary = (filters: ReviewFilters) => {
  const { clause, params } = buildFilterClause(filters);
  return db
    .prepare(`SELECT category, COUNT(*) AS count, ROUND(AVG(rating), 1) AS average FROM reviews r ${clause} GROUP BY category ORDER BY count DESC`)
    .all(...params) as { category: string; count: number; average: number | null }[];
};
