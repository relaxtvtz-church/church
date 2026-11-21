import type { RequestHandler } from 'express';
import { db } from '../db/database.js';
import { ApiError } from '../utils/http.js';

const increment = db.prepare(`
  INSERT INTO rate_limits (key, count, reset_at) VALUES (?, 1, ?)
  ON CONFLICT(key) DO UPDATE SET
    count = CASE WHEN rate_limits.reset_at <= ? THEN 1 ELSE rate_limits.count + 1 END,
    reset_at = CASE WHEN rate_limits.reset_at <= ? THEN ? ELSE rate_limits.reset_at END
  RETURNING count, reset_at
`);

const cleanup = db.prepare('DELETE FROM rate_limits WHERE reset_at < ?');

export const rateLimit = (
  name: string,
  max: number,
  windowMs: number,
  identifier: (req: Parameters<RequestHandler>[0]) => string = (req) => req.ip ?? 'unknown',
): RequestHandler => {
  return (req, _res, next) => {
    if (Math.random() < 0.05) cleanup.run(Date.now());
    const key = `${name}:${identifier(req)}`;
    const now = Date.now();
    const result = increment.get(key, now + windowMs, now, now, now + windowMs) as
      | { count: number; reset_at: number }
      | undefined;

    if (result && result.count > max) {
      const minutes = Math.max(1, Math.ceil((result.reset_at - now) / 60000));
      next(new ApiError(429, `Too many requests. Please try again in ${minutes} minute${minutes === 1 ? '' : 's'}.`));
      return;
    }
    next();
  };
};
