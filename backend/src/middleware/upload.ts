import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import { env } from '../config/env.js';
import { db } from '../db/database.js';
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

const validFilename = (filename: string): boolean => /^[\w-]+\.(jpg|png|webp|gif)$/.test(filename);

export const saveImage = async (file: Express.Multer.File): Promise<string> => {
  const filename = `${Date.now()}-${crypto.randomUUID()}.${extensionFor(file.mimetype)}`;
  if (db.isPostgres) {
    await db
      .prepare('INSERT INTO uploads (filename, mime_type, data) VALUES (?, ?, ?)')
      .run(filename, file.mimetype, file.buffer);
  } else {
    fs.mkdirSync(env.uploadDir, { recursive: true });
    fs.writeFileSync(path.join(env.uploadDir, filename), file.buffer, { mode: 0o644 });
  }
  return `/uploads/${filename}`;
};

export const getUploadedImage = async (filename: string): Promise<{ mime_type: string; data: Buffer } | null> => {
  if (!validFilename(filename)) return null;
  const row = (await db.prepare('SELECT mime_type, data FROM uploads WHERE filename = ?').get(filename)) as
    | { mime_type: string; data: Buffer }
    | undefined;
  if (row) return { mime_type: row.mime_type, data: Buffer.isBuffer(row.data) ? row.data : Buffer.from(row.data) };

  if (!db.isPostgres) {
    const file = path.join(env.uploadDir, filename);
    if (fs.existsSync(file)) {
      const mime = filename.endsWith('.png')
        ? 'image/png'
        : filename.endsWith('.jpg')
          ? 'image/jpeg'
          : filename.endsWith('.webp')
            ? 'image/webp'
            : 'image/gif';
      return { mime_type: mime, data: fs.readFileSync(file) };
    }
  }
  return null;
};

export const removeImage = async (url: string | null | undefined): Promise<void> => {
  if (!url?.startsWith('/uploads/')) return;
  const filename = path.basename(url);
  if (!validFilename(filename)) return;
  await db.prepare('DELETE FROM uploads WHERE filename = ?').run(filename);
  if (!db.isPostgres) {
    const file = path.join(env.uploadDir, filename);
    if (fs.existsSync(file)) fs.unlinkSync(file);
  }
};
