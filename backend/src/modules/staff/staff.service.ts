import { db } from '../../db/database.js';

const num = (value: unknown): number => Number(value ?? 0);

export const getStaffWithStats = async () =>
  ((await db
    .prepare(
      `SELECT s.*,
              COUNT(r.id) AS total_reviews,
              ROUND(AVG(r.rating), 1) AS average_rating
       FROM staff s
       LEFT JOIN reviews r ON r.staff_id = s.id AND r.status != 'archived'
       GROUP BY s.id
       ORDER BY s.status = 'inactive', s.full_name ASC`,
    )
    .all()) as StaffWithStats[]).map((row) => ({
    ...row,
    id: num(row.id),
    total_reviews: num(row.total_reviews),
    average_rating: row.average_rating === null || row.average_rating === undefined ? null : num(row.average_rating),
  }));

export interface StaffWithStats {
  id: number;
  full_name: string;
  position: string;
  ministry: string;
  bio: string;
  photo_url: string | null;
  status: string;
  total_reviews: number;
  average_rating: number | null;
  created_at: string;
  updated_at: string;
}

export const getStaffProfile = async (id: number) => {
  const row = (await db.prepare('SELECT * FROM staff WHERE id = ?').get(id)) as StaffWithStats | undefined;
  if (!row) return undefined;
  const staff = { ...row, id: num(row.id) };

  const statsRow = (await db
    .prepare(
      `SELECT COUNT(*) AS total_reviews, ROUND(AVG(rating), 1) AS average_rating
       FROM reviews WHERE staff_id = ? AND status != 'archived'`,
    )
    .get(id)) as { total_reviews: number; average_rating: number | null };
  const stats = {
    total_reviews: num(statsRow.total_reviews),
    average_rating:
      statsRow.average_rating === null || statsRow.average_rating === undefined ? null : num(statsRow.average_rating),
  };

  const distributionRows = (await db
    .prepare('SELECT rating, COUNT(*) AS count FROM reviews WHERE staff_id = ? AND status != ? GROUP BY rating')
    .all(id, 'archived')) as { rating: number; count: number }[];
  const distMap = new Map(distributionRows.map((row) => [num(row.rating), num(row.count)]));

  const recentReviews = (
    await db.prepare('SELECT * FROM reviews WHERE staff_id = ? ORDER BY created_at DESC LIMIT 5').all(id)
  ).map((row) => ({
    ...row,
    id: num(row.id),
    staff_id: row.staff_id ? num(row.staff_id) : null,
    rating: num(row.rating),
  }));

  return {
    staff: { ...staff, ...stats },
    distribution: [1, 2, 3, 4, 5].map((rating) => ({ rating, count: distMap.get(rating) ?? 0 })),
    recentReviews,
  };
};
