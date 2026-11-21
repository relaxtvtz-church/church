import { Router } from 'express';
import { z } from 'zod';
import { db, now } from '../../db/database.js';
import { requireAuth } from '../../middleware/auth.js';
import { removeImage } from '../../middleware/upload.js';
import { validate } from '../../middleware/validate.js';
import { ApiError, asyncHandler, notFound } from '../../utils/http.js';
import { cleanText } from '../../utils/sanitize.js';
import { getStaffProfile, getStaffWithStats } from './staff.service.js';

export const staffRouter = Router();

staffRouter.get(
  '/public',
  asyncHandler(async (_req, res) => {
    const staff = await db
      .prepare("SELECT id, full_name, position, ministry, bio, photo_url FROM staff WHERE status = 'active' ORDER BY full_name ASC")
      .all();
    res.json({ staff });
  }),
);

staffRouter.use(requireAuth);

const staffSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name is required').max(120),
  position: z.string().max(120).optional(),
  ministry: z.string().max(120).optional(),
  bio: z.string().max(1000).optional(),
  photoUrl: z.string().regex(/^(\/uploads\/[\w-]+\.(jpg|png|webp|gif))?$/, 'Invalid photo').nullable().optional(),
  status: z.enum(['active', 'inactive']).optional(),
});

type StaffInput = z.infer<typeof staffSchema>;

const normalize = (input: StaffInput) => ({
  fullName: cleanText(input.fullName, 120),
  position: cleanText(input.position, 120),
  ministry: cleanText(input.ministry, 120),
  bio: cleanText(input.bio, 1000),
  photoUrl: input.photoUrl ?? null,
  status: input.status ?? 'active',
});

staffRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    res.json({ staff: await getStaffWithStats() });
  }),
);

staffRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const profile = await getStaffProfile(Number(req.params.id));
    if (!profile) notFound('Staff member not found.');
    res.json(profile);
  }),
);

staffRouter.post(
  '/',
  validate(staffSchema),
  asyncHandler(async (req, res) => {
    const data = normalize(req.body as StaffInput);
    const result = await db
      .prepare(
        `INSERT INTO staff (full_name, position, ministry, bio, photo_url, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(data.fullName, data.position, data.ministry, data.bio, data.photoUrl, data.status, now(), now());
    res.status(201).json({ id: Number(result.lastInsertRowid), message: 'Staff member added.' });
  }),
);

staffRouter.put(
  '/:id',
  validate(staffSchema),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const existing = (await db.prepare('SELECT photo_url FROM staff WHERE id = ?').get(id)) as
      | { photo_url: string | null }
      | undefined;
    if (!existing) throw new ApiError(404, 'Staff member not found.');

    const data = normalize(req.body as StaffInput);
    await db
      .prepare(
        `UPDATE staff SET full_name = ?, position = ?, ministry = ?, bio = ?, photo_url = ?, status = ?, updated_at = ?
         WHERE id = ?`,
      )
      .run(data.fullName, data.position, data.ministry, data.bio, data.photoUrl, data.status, now(), id);

    if (existing.photo_url && existing.photo_url !== data.photoUrl) await removeImage(existing.photo_url);
    res.json({ message: 'Staff member updated.' });
  }),
);

staffRouter.patch(
  '/:id/status',
  asyncHandler(async (req, res) => {
    const status = req.body?.status;
    if (status !== 'active' && status !== 'inactive') throw new ApiError(400, 'Invalid status.');
    const result = await db
      .prepare('UPDATE staff SET status = ?, updated_at = ? WHERE id = ?')
      .run(status, now(), Number(req.params.id));
    if (!result.changes) notFound('Staff member not found.');
    res.json({ message: `Staff member marked ${status}.` });
  }),
);

staffRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const existing = (await db.prepare('SELECT photo_url FROM staff WHERE id = ?').get(id)) as
      | { photo_url: string | null }
      | undefined;
    if (!existing) throw new ApiError(404, 'Staff member not found.');

    // Reviews keep their snapshot of the staff name; the FK sets staff_id to NULL.
    await db.prepare('DELETE FROM staff WHERE id = ?').run(id);
    await removeImage(existing.photo_url);
    res.json({ message: 'Staff member removed. Their historical reviews have been preserved.' });
  }),
);
