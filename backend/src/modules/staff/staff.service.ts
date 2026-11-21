import { db } from '../../db/database.js';

export const getStaffWithStats = () =>
  db
    .prepare(
      `SELECT s.*,
              COUNT(r.id) AS total_reviews,
              ROUND(AVG(r.rating), 1) AS average_rating
       FROM staff s
       LEFT JOIN reviews r ON r.staff_id = s.id AND r.status != 'archived'
       GROUP BY s.id
       ORDER BY s.status = 'inactive', s.full_name ASC`,
    )
    .all() as StaffWithStats[];

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

export const getStaffProfile = (id: number) => {
  const staff = db.prepare('SELECT * FROM staff WHERE id = ?').get(id) as StaffWithStats | undefined;
  if (!staff) return undefined;

  const stats = db
    .prepare(
      `SELECT COUNT(*) AS total_reviews, ROUND(AVG(rating), 1) AS average_rating
       FROM reviews WHERE staff_id = ? AND status != 'archived'`,
    )
    .get(id) as { total_reviews: number; average_rating: number | null };

  const distributionRows = db
    .prepare('SELECT rating, COUNT(*) AS count FROM reviews WHERE staff_id = ? AND status != ? GROUP BY rating')
    .all(id, 'archived') as { rating: number; count: number }[];
  const distMap = new Map(distributionRows.map((row) => [row.rating, row.count]));

  const recentReviews = db
    .prepare('SELECT * FROM reviews WHERE staff_id = ? ORDER BY created_at DESC LIMIT 5')
    .all(id);

  return {
    staff: { ...staff, ...stats },
    distribution: [1, 2, 3, 4, 5].map((rating) => ({ rating, count: distMap.get(rating) ?? 0 })),
    recentReviews,
  };
};
