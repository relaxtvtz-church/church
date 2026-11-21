import { Router } from 'express';
import { z } from 'zod';
import { db, now } from '../../db/database.js';
import { requireAuth } from '../../middleware/auth.js';
import { removeImage } from '../../middleware/upload.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler, notFound } from '../../utils/http.js';
import { cleanText } from '../../utils/sanitize.js';

export const settingsRouter = Router();

export const getSettingsRow = async () =>
  (await db.prepare('SELECT * FROM church_settings WHERE id = 1').get()) as {
    id: number;
    church_name: string;
    logo_url: string | null;
    location: string | null;
    phone: string | null;
    email: string | null;
    welcome_message: string | null;
    feedback_intro: string | null;
    footer_text: string | null;
    service_info: string | null;
    map_lat: string;
    map_lng: string;
    instagram_url: string;
    tiktok_url: string;
    facebook_url: string;
    youtube_url: string;
    updated_at: string;
  };

const publicFields = [
  'church_name',
  'logo_url',
  'location',
  'phone',
  'email',
  'welcome_message',
  'feedback_intro',
  'footer_text',
  'service_info',
  'map_lat',
  'map_lng',
  'instagram_url',
  'tiktok_url',
  'facebook_url',
  'youtube_url',
] as const;

settingsRouter.get(
  '/public',
  asyncHandler(async (_req, res) => {
    const settings = await getSettingsRow();
    res.json(Object.fromEntries(publicFields.map((field) => [field, settings[field]])));
  }),
);

settingsRouter.use(requireAuth);

settingsRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    res.json({ settings: await getSettingsRow() });
  }),
);

const settingsSchema = z.object({
  churchName: z.string().trim().min(2, 'Church name is required').max(150),
  location: z.string().max(250).optional(),
  phone: z.string().max(40).optional(),
  email: z.union([z.string().email('Enter a valid email address'), z.literal('')]).optional(),
  welcomeMessage: z.string().max(1000).optional(),
  feedbackIntro: z.string().max(1000).optional(),
  footerText: z.string().max(500).optional(),
  serviceInfo: z.string().max(500).optional(),
  mapLat: z.string().regex(/^(-?\d+(?:\.\d+)?)?$/, 'Invalid latitude').optional(),
  mapLng: z.string().regex(/^(-?\d+(?:\.\d+)?)?$/, 'Invalid longitude').optional(),
  instagramUrl: z.union([z.string().url('Enter a valid URL'), z.literal('')]).optional(),
  tiktokUrl: z.union([z.string().url('Enter a valid URL'), z.literal('')]).optional(),
  facebookUrl: z.union([z.string().url('Enter a valid URL'), z.literal('')]).optional(),
  youtubeUrl: z.union([z.string().url('Enter a valid URL'), z.literal('')]).optional(),
  logoUrl: z
    .string()
    .regex(/^(\/(uploads|brand)\/[\w-]+\.(jpg|png|webp|gif))?$/, 'Invalid logo')
    .nullable()
    .optional(),
});

settingsRouter.put(
  '/',
  validate(settingsSchema),
  asyncHandler(async (req, res) => {
    const input = req.body as z.infer<typeof settingsSchema>;
    const settings = await getSettingsRow();
    if (!settings) notFound('Church settings not found.');

    const logoUrl = input.logoUrl ?? null;
    await db
      .prepare(
        `UPDATE church_settings SET church_name = ?, logo_url = ?, location = ?, phone = ?, email = ?,
         welcome_message = ?, feedback_intro = ?, footer_text = ?, service_info = ?, map_lat = ?, map_lng = ?,
         instagram_url = ?, tiktok_url = ?, facebook_url = ?, youtube_url = ?, updated_at = ? WHERE id = 1`,
      )
      .run(
        cleanText(input.churchName, 150),
        logoUrl,
        cleanText(input.location, 250),
        cleanText(input.phone, 40),
        cleanText(input.email, 150),
        cleanText(input.welcomeMessage, 1000),
        cleanText(input.feedbackIntro, 1000),
        cleanText(input.footerText, 500),
        cleanText(input.serviceInfo, 500),
        cleanText(input.mapLat, 30),
        cleanText(input.mapLng, 30),
        cleanText(input.instagramUrl, 250),
        cleanText(input.tiktokUrl, 250),
        cleanText(input.facebookUrl, 250),
        cleanText(input.youtubeUrl, 250),
        now(),
      );

    if (settings.logo_url && settings.logo_url !== logoUrl) await removeImage(settings.logo_url);
    res.json({ message: 'Church information saved.', settings: await getSettingsRow() });
  }),
);
