import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { env } from '../config/env.js';
import { schema } from './schema.js';

fs.mkdirSync(path.dirname(env.dbPath), { recursive: true });
fs.mkdirSync(env.uploadDir, { recursive: true });

export const db = new Database(env.dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.pragma('busy_timeout = 5000');
db.exec(schema);

/** Add columns introduced after the first release without discarding existing data. */
const addColumnIfMissing = (table: string, column: string, definition: string): void => {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  if (!columns.some((item) => item.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
};

addColumnIfMissing('church_settings', 'map_lat', "TEXT NOT NULL DEFAULT '-6.7980824'");
addColumnIfMissing('church_settings', 'map_lng', "TEXT NOT NULL DEFAULT '39.2302042'");
addColumnIfMissing('church_settings', 'instagram_url', "TEXT NOT NULL DEFAULT 'https://www.instagram.com/dreamerscenter_tz'");
addColumnIfMissing('church_settings', 'tiktok_url', "TEXT NOT NULL DEFAULT 'https://www.tiktok.com/@dreamerscentre_tz'");
addColumnIfMissing('church_settings', 'facebook_url', "TEXT NOT NULL DEFAULT 'https://www.facebook.com/DreamerscentreTz'");
addColumnIfMissing('church_settings', 'youtube_url', "TEXT NOT NULL DEFAULT 'https://www.youtube.com/@thedreamerscentretzchurch'");
addColumnIfMissing('registrations', 'email', "TEXT NOT NULL DEFAULT ''");
addColumnIfMissing('registrations', 'phone', "TEXT NOT NULL DEFAULT ''");
addColumnIfMissing('registrations', 'guardian_phone', "TEXT NOT NULL DEFAULT ''");

export const now = (): string => new Date().toISOString();

export type DbRow = Record<string, unknown>;
