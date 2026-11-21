import { Router } from 'express';
import { z } from 'zod';
import { db, now } from '../../db/database.js';
import { requireAuth } from '../../middleware/auth.js';
import { rateLimit } from '../../middleware/rateLimit.js';
import { validate } from '../../middleware/validate.js';
import { CATEGORIES } from '../../utils/format.js';
import { ApiError, asyncHandler } from '../../utils/http.js';
import { parseReviewFilters } from '../../utils/query.js';
import { cleanText, optionalText } from '../../utils/sanitize.js';
import { getReview, listReviews } from './reviews.service.js';

export const reviewsRouter = Router();

const createReviewSchema = z.object({
  reviewerName: z.string().max(120).nullable().optional(),
  phone: z.string().max(40).nullable().optional(),
  staffId: z.number().int().positive().nullable().optional(),
  category: z.enum(CATEGORIES, { error: () => 'Please select a feedback category.' }),
  rating: z.number().int().min(1, 'Please choose a rating.').max(5),
  message: z.string().trim().min(10, 'Please write at least 10 characters of feedback.').max(3000),
});

reviewsRouter.post(
  '/',
  rateLimit('review-submit', 5, 30 * 60 * 1000),
  validate(createReviewSchema),
  asyncHandler(async (req, res) => {
    const input = req.body as z.infer<typeof createReviewSchema>;

    let staffName: string | null = null;
    if (input.staffId) {
      const staff = (await db
        .prepare("SELECT full_name FROM staff WHERE id = ? AND status = 'active'")
        .get(input.staffId)) as { full_name: string } | undefined;
      if (!staff) throw new ApiError(400, 'The selected staff member is no longer available.');
      staffName = staff.full_name;
    }

    const result = await db
      .prepare(
        `INSERT INTO reviews (reviewer_name, phone, staff_id, staff_name, category, rating, message, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'new', ?)`,
      )
      .run(
        optionalText(input.reviewerName, 120),
        optionalText(input.phone, 40),
        input.staffId ?? null,
        staffName,
        input.category,
        input.rating,
        cleanText(input.message, 3000),
        now(),
      );

    const settings = (await db.prepare('SELECT church_name FROM church_settings WHERE id = 1').get()) as {
      church_name: string;
    };

    res.status(201).json({
      id: Number(result.lastInsertRowid),
      message: `Thank you for sharing your experience with ${settings.church_name}. Your feedback has been received and is appreciated.`,
    });
  }),
);

reviewsRouter.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const filters = parseReviewFilters(req.query);
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
    const { rows, total } = await listReviews(filters, { page, limit });
    res.json({ reviews: rows, total, page, limit, pages: Math.max(1, Math.ceil(total / limit)) });
  }),
);

reviewsRouter.get(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const review = await getReview(Number(req.params.id));
    if (!review) throw new ApiError(404, 'Review not found.');
    res.json({ review });
  }),
);

const statusSchema = z.object({ status: z.enum(['new', 'reviewed', 'archived']) });

reviewsRouter.patch(
  '/:id/status',
  requireAuth,
  validate(statusSchema),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const result = await db.prepare('UPDATE reviews SET status = ? WHERE id = ?').run(req.body.status, id);
    if (!result.changes) throw new ApiError(404, 'Review not found.');
    res.json({ review: await getReview(id) });
  }),
);

reviewsRouter.delete(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const result = await db.prepare('DELETE FROM reviews WHERE id = ?').run(Number(req.params.id));
    if (!result.changes) throw new ApiError(404, 'Review not found.');
    res.json({ message: 'Review deleted.' });
  }),
);
