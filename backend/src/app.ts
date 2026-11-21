import fs from 'node:fs';
import path from 'node:path';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import express from 'express';
import helmet from 'helmet';
import { env } from './config/env.js';
import { seed } from './db/seed.js';
import { attachAdmin } from './middleware/auth.js';
import { errorHandler } from './middleware/error.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { reportsRouter } from './modules/reports/reports.routes.js';
import { reviewsRouter } from './modules/reviews/reviews.routes.js';
import { settingsRouter } from './modules/settings/settings.routes.js';
import { staffRouter } from './modules/staff/staff.routes.js';
import { statsRouter } from './modules/stats/stats.routes.js';
import { uploadsRouter } from './modules/uploads/uploads.routes.js';
import { advertisementRouter } from './modules/advertise/advertisement.routes.js';
import { registrationRouter } from './modules/advertise/registrations.routes.js';

seed();

export const app = express();

app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  }),
);
app.use(cors({ origin: env.allowedOrigin, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(attachAdmin);

app.use(
  '/uploads',
  express.static(env.uploadDir, {
    fallthrough: false,
    setHeaders: (res) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Cache-Control', 'public, max-age=86400');
    },
  }),
);

app.use('/api/auth', authRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/staff', staffRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/stats', statsRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/uploads', uploadsRouter);
app.use('/api/advertisement', advertisementRouter);
app.use('/api/registrations', registrationRouter);

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Endpoint not found.' });
});

if (fs.existsSync(path.join(env.publicDir, 'index.html'))) {
  app.use(express.static(env.publicDir));
  app.get('*', (_req, res) => res.sendFile(path.join(env.publicDir, 'index.html')));
}

app.use(errorHandler);
