import crypto from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { env } from '../config/env.js';
import { db, now } from '../db/database.js';
import { ApiError } from '../utils/http.js';

const COOKIE_NAME = 'dcf_session';
const TTL_MS = env.sessionTtlHours * 60 * 60 * 1000;

type Admin = { id: number; name: string; email: string; role: string };
type SessionRow = { admin_id: number; name: string; email: string; role: string; expires_at: string };

const hashToken = (token: string): string => crypto.createHash('sha256').update(token).digest('hex');

const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: env.isProduction,
  path: '/',
  maxAge: TTL_MS,
};

export const createSession = async (res: Response, adminId: number, remember = false): Promise<void> => {
  const token = crypto.randomBytes(32).toString('hex');
  const ttl = remember ? TTL_MS * 30 : TTL_MS;
  const expiresAt = new Date(Date.now() + ttl).toISOString();
  await db
    .prepare('INSERT INTO sessions (token_hash, admin_id, created_at, expires_at) VALUES (?, ?, ?, ?)')
    .run(hashToken(token), adminId, now(), expiresAt);
  res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ttl });
};

export const destroySession = async (req: Request, res: Response): Promise<void> => {
  const token = req.cookies?.[COOKIE_NAME];
  if (typeof token === 'string') {
    await db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(hashToken(token));
  }
  res.clearCookie(COOKIE_NAME, { path: '/' });
};

export const attachAdmin = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.cookies?.[COOKIE_NAME];
    if (typeof token === 'string' && token.length === 64) {
      const session = (await db
        .prepare(
          `SELECT s.admin_id, a.name, a.email, a.role, s.expires_at
           FROM sessions s JOIN admins a ON a.id = s.admin_id
           WHERE s.token_hash = ?`,
        )
        .get(hashToken(token))) as SessionRow | undefined;

      if (session) {
        if (new Date(session.expires_at).getTime() > Date.now()) {
          req.admin = {
            id: Number(session.admin_id),
            name: session.name,
            email: session.email,
            role: session.role,
          };
        } else {
          await db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(hashToken(token));
        }
      }
    }
    next();
  } catch (error) {
    next(error);
  }
};

export const requireAuth = (req: Request, _res: Response, next: NextFunction): void => {
  if (!req.admin) {
    next(new ApiError(401, 'Your session has expired. Please sign in again.'));
    return;
  }
  next();
};

export const currentAdmin = (req: Request): Admin => {
  if (!req.admin) throw new ApiError(401, 'Not authenticated');
  return req.admin;
};
