import type { RequestHandler } from 'express';
import { ZodError, type ZodTypeAny } from 'zod';
import { ApiError } from '../utils/http.js';

export const validate =
  (schema: ZodTypeAny): RequestHandler =>
  (req, _res, next) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const first = error.issues[0];
        const field = first?.path.join('.');
        next(new ApiError(400, field ? `${field}: ${first.message}` : (first?.message ?? 'Invalid input')));
        return;
      }
      next(error);
    }
  };
