import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import { env } from '../config/env.js';
import { ApiError } from '../utils/http.js';

const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

export const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.maxUploadMb * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    if (!allowedTypes.has(file.mimetype)) {
      callback(new ApiError(400, 'Only JPG, PNG, WEBP or GIF images are allowed.'));
      return;
    }
    callback(null, true);
  },
}).single('image');

const extensionFor = (mimetype: string): string =>
  ({ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' })[mimetype] ?? 'img';

export const saveImage = (file: Express.Multer.File): string => {
  const filename = `${Date.now()}-${crypto.randomUUID()}.${extensionFor(file.mimetype)}`;
  const destination = path.join(env.uploadDir, filename);
  fs.writeFileSync(destination, file.buffer, { mode: 0o644 });
  return `/uploads/${filename}`;
};

export const removeImage = (url: string | null | undefined): void => {
  if (!url?.startsWith('/uploads/')) return;
  const filename = path.basename(url);
  if (!/^[\w-]+\.(jpg|png|webp|gif)$/.test(filename)) return;
  const file = path.join(env.uploadDir, filename);
  if (fs.existsSync(file)) fs.unlinkSync(file);
};
