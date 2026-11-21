import { Router } from 'express';
import { z } from 'zod';
import { db, now } from '../../db/database.js';
import { requireAuth } from '../../middleware/auth.js';
import { removeImage } from '../../middleware/upload.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../utils/http.js';
import { cleanText } from '../../utils/sanitize.js';

export interface AdvertisementRow {
  id: number;
  title: string;
  description: string;
  university: string;
  image_url: string | null;
  cta_label: string;
  is_active: number;
  updated_at: string;
}

export const getAdvertisement = (): AdvertisementRow =>
  db.prepare('SELECT * FROM advertisement WHERE id = 1').get() as AdvertisementRow;

export const advertisementRouter = Router();

advertisementRouter.get('/public', (_req, res) => {
  const ad = getAdvertisement();
  res.json({
    title: ad.title,
    description: ad.description,
    university: ad.university,
    image_url: ad.image_url,
    cta_label: ad.cta_label,
    is_active: ad.is_active === 1,
  });
});

advertisementRouter.use(requireAuth);

advertisementRouter.get(
  '/',
  asyncHandler((_req, res) => {
    res.json({ advertisement: getAdvertisement() });
  }),
);

const advertisementSchema = z.object({
  title: z.string().trim().min(2, 'Title is required').max(150),
  description: z.string().max(1000).optional(),
  university: z.string().max(250).optional(),
  ctaLabel: z.string().max(80).optional(),
  imageUrl: z
    .string()
    .regex(/^(\/(uploads|brand)\/[\w-]+\.(jpg|png|webp|gif))?$/, 'Invalid poster image')
    .nullable()
    .optional(),
  isActive: z.boolean().optional(),
});

advertisementRouter.put(
  '/',
  validate(advertisementSchema),
  asyncHandler((req, res) => {
    const input = req.body as z.infer<typeof advertisementSchema>;
    const existing = getAdvertisement();
    const imageUrl = input.imageUrl ?? '/brand/church-banner.jpg';

    db.prepare(
      `UPDATE advertisement SET title = ?, description = ?, university = ?, image_url = ?,
       cta_label = ?, is_active = ?, updated_at = ? WHERE id = 1`,
    ).run(
      cleanText(input.title, 150),
      cleanText(input.description, 1000),
      cleanText(input.university, 250),
      imageUrl,
      cleanText(input.ctaLabel, 80) || 'Register your interest',
      input.isActive === false ? 0 : 1,
      now(),
    );

    if (existing.image_url && existing.image_url !== imageUrl) removeImage(existing.image_url);
    res.json({ message: 'Advertisement updated. The public website has been refreshed.', advertisement: getAdvertisement() });
  }),
);
