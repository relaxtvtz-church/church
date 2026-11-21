import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(here, '../..');
const projectRoot = path.resolve(backendRoot, '..');

dotenv.config({ path: [path.join(projectRoot, '.env'), path.join(backendRoot, '.env')] });

const numberFrom = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  isProduction: process.env.NODE_ENV === 'production',
  port: numberFrom(process.env.PORT, 4000),
  dbPath: path.isAbsolute(process.env.DB_PATH ?? './data/church.db')
    ? (process.env.DB_PATH as string)
    : path.join(backendRoot, process.env.DB_PATH ?? './data/church.db'),
  uploadDir: path.join(backendRoot, 'uploads'),
  publicDir: path.join(projectRoot, 'frontend', 'dist'),
  frontendPublicDir: path.join(projectRoot, 'frontend', 'public'),
  sessionSecret: process.env.SESSION_SECRET ?? 'development-only-session-secret-change-me',
  sessionTtlHours: numberFrom(process.env.SESSION_TTL_HOURS, 24),
  maxUploadMb: numberFrom(process.env.MAX_UPLOAD_MB, 3),
  allowedOrigin: process.env.ALLOWED_ORIGIN ?? 'http://localhost:5173',
  admin: {
    name: process.env.ADMIN_NAME ?? 'Church Administrator',
    email: process.env.ADMIN_EMAIL ?? 'shorahgodfrey@gmail.com',
    password: process.env.ADMIN_PASSWORD ?? 'Godfrey12@[][]',
  },
};
