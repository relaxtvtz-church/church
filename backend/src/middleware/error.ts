import type { ErrorRequestHandler } from 'express';
import multer from 'multer';
import { ZodError } from 'zod';
import { env } from '../config/env.js';
import { ApiError } from '../utils/http.js';

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ApiError) {
    res.status(error.status).json({ error: error.message });
    return;
  }
  if (error instanceof ZodError) {
    res.status(400).json({ error: error.issues[0]?.message ?? 'Invalid input' });
    return;
  }
  if (error instanceof multer.MulterError) {
    const message = error.code === 'LIMIT_FILE_SIZE' ? `Image must be ${env.maxUploadMb}MB or smaller.` : 'Invalid upload.';
    res.status(400).json({ error: message });
    return;
  }
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Something went wrong. Please try again.' });
};
