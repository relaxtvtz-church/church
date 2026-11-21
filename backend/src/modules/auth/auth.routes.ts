import bcrypt from 'bcryptjs';
import { Router } from 'express';
import { z } from 'zod';
import { db, now } from '../../db/database.js';
import { currentAdmin, createSession, destroySession, requireAuth } from '../../middleware/auth.js';
import { rateLimit } from '../../middleware/rateLimit.js';
import { validate } from '../../middleware/validate.js';
import { ApiError, asyncHandler } from '../../utils/http.js';

export const authRouter = Router();

const loginSchema = z.object({
  identifier: z.string().min(1, 'Email or username is required').max(150),
  password: z.string().min(1, 'Password is required').max(200),
  remember: z.boolean().optional().default(false),
});

authRouter.post(
  '/login',
  rateLimit('login', 12, 15 * 60 * 1000, (req) => `${req.ip ?? 'unknown'}:${String(req.body?.identifier ?? '')}`),
  validate(loginSchema),
  asyncHandler((req, res) => {
    const { identifier, password, remember } = req.body as z.infer<typeof loginSchema>;
    const admin = db
      .prepare('SELECT id, name, email, password_hash FROM admins WHERE email = ? COLLATE NOCASE OR name = ? COLLATE NOCASE')
      .get(identifier.trim(), identifier.trim()) as
      | { id: number; name: string; email: string; password_hash: string }
      | undefined;

    if (!admin || !bcrypt.compareSync(password, admin.password_hash)) {
      throw new ApiError(401, 'Incorrect email or password.');
    }

    createSession(res, admin.id, remember);
    res.json({ admin: { id: admin.id, name: admin.name, email: admin.email } });
  }),
);

authRouter.post('/logout', (req, res) => {
  destroySession(req, res);
  res.json({ message: 'Signed out successfully.' });
});

authRouter.get('/me', (req, res) => {
  res.json({ admin: req.admin ?? null });
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1).max(200),
  newPassword: z.string().min(8, 'New password must be at least 8 characters').max(200),
});

authRouter.put(
  '/password',
  requireAuth,
  validate(passwordSchema),
  asyncHandler((req, res) => {
    const admin = currentAdmin(req);
    const { currentPassword, newPassword } = req.body as z.infer<typeof passwordSchema>;
    const row = db.prepare('SELECT password_hash FROM admins WHERE id = ?').get(admin.id) as { password_hash: string };
    if (!bcrypt.compareSync(currentPassword, row.password_hash)) {
      throw new ApiError(400, 'Current password is incorrect.');
    }
    db.prepare('UPDATE admins SET password_hash = ? WHERE id = ?').run(bcrypt.hashSync(newPassword, 12), admin.id);
    db.prepare('DELETE FROM sessions WHERE admin_id = ?').run(admin.id);
    destroySession(req, res);
    res.json({ message: 'Password updated. Please sign in again.' });
  }),
);
