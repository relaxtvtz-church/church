import { Router } from 'express';
import { z } from 'zod';
import { db, now } from '../../db/database.js';
import { requireAuth } from '../../middleware/auth.js';
import { rateLimit } from '../../middleware/rateLimit.js';
import { validate } from '../../middleware/validate.js';
import { ApiError, asyncHandler, notFound } from '../../utils/http.js';
import { cleanText } from '../../utils/sanitize.js';

export interface RegistrationRow {
  id: number;
  full_name: string;
  parent_name: string;
  email: string;
  phone: string;
  guardian_phone: string;
  location: string;
  status: string;
  studying_at: string;
  university: string;
  comments: string;
  created_at: string;
}

export const registrationRouter = Router();

const registrationSchema = z.object({
  fullName: z.string().trim().min(2, 'Enter your full name').max(120),
  parentName: z.string().trim().min(2, "Enter your parent's or guardian's name").max(120),
  email: z.union([z.string().email('Enter a valid email address'), z.literal('')]).optional(),
  phone: z.string().trim().min(7, 'Enter your phone number').max(40),
  guardianPhone: z.string().trim().min(7, "Enter your parent's or guardian's phone number").max(40),
  location: z.string().trim().min(2, 'Enter where you live').max(200),
  status: z.enum(['Student', 'Employed', 'Self-employed', 'Unemployed', 'Other']),
  studyingAt: z.string().max(200).optional(),
  university: z.string().max(200).optional(),
  comments: z.string().max(2000).optional(),
});

registrationRouter.post(
  '/',
  rateLimit('registration-submit', 5, 30 * 60 * 1000),
  validate(registrationSchema),
  asyncHandler(async (req, res) => {
    const input = req.body as z.infer<typeof registrationSchema>;
    const result = await db
      .prepare(
        `INSERT INTO registrations (full_name, parent_name, email, phone, guardian_phone, location, status,
         studying_at, university, comments, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        cleanText(input.fullName, 120),
        cleanText(input.parentName, 120),
        cleanText(input.email, 150),
        cleanText(input.phone, 40),
        cleanText(input.guardianPhone, 40),
        cleanText(input.location, 200),
        input.status,
        cleanText(input.studyingAt, 200),
        cleanText(input.university, 200),
        cleanText(input.comments, 2000),
        now(),
      );

    res.status(201).json({
      id: Number(result.lastInsertRowid),
      message: 'Thank you for registering. Our leadership team will be in touch with you.',
    });
  }),
);

registrationRouter.use(requireAuth);

registrationRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const rawSearch = typeof req.query.search === 'string' ? req.query.search : '';
    const search = cleanText(rawSearch, 120);
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));

    const where = search
      ? `WHERE full_name LIKE @search OR parent_name LIKE @search OR email LIKE @search OR phone LIKE @search
         OR guardian_phone LIKE @search OR location LIKE @search OR studying_at LIKE @search
         OR university LIKE @search OR status LIKE @search`
      : '';
    const params = search ? { search: `%${search}%` } : {};

    const totalRow = (await db.prepare(`SELECT COUNT(*) AS count FROM registrations ${where}`).get(params)) as {
      count: number;
    };
    const registrations = (await db
      .prepare(`SELECT * FROM registrations ${where} ORDER BY created_at DESC LIMIT @limit OFFSET @offset`)
      .all({ ...params, limit, offset: (page - 1) * limit })) as RegistrationRow[];

    const total = Number(totalRow.count);
    res.json({
      registrations,
      total,
      page,
      limit,
      pages: Math.max(1, Math.ceil(total / limit)),
    });
  }),
);

registrationRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) throw new ApiError(400, 'Invalid registration.');
    const result = await db.prepare('DELETE FROM registrations WHERE id = ?').run(id);
    if (!result.changes) notFound('Registration not found.');
    res.json({ message: 'Registration removed.' });
  }),
);
