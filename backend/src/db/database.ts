import fs from 'node:fs';
import path from 'node:path';
import pg from 'pg';
import { env } from '../config/env.js';
import { postgresSchema } from './postgresSchema.js';
import { schema } from './schema.js';

if (!env.databaseUrl) {
  fs.mkdirSync(path.dirname(env.dbPath), { recursive: true });
  fs.mkdirSync(env.uploadDir, { recursive: true });
}

let sqlite: any = null;
const pool = env.databaseUrl
  ? new pg.Pool({
      connectionString: env.databaseUrl,
      max: 1,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
      ssl: { rejectUnauthorized: false },
      allowExitOnIdle: true,
    })
  : null;

const idTables = /\b(?:admins|staff|reviews|church_settings|advertisement|registrations)\b/i;

const toPostgres = (sqlText: string): string =>
  sqlText
    .replace(/\bINSERT\s+OR\s+IGNORE\s+INTO\b/gi, 'INSERT INTO')
    .replace(/\bLIKE\b/gi, 'ILIKE')
    .replace(/strftime\('%Y-%m',\s*created_at\)/gi, "to_char(created_at::timestamp, 'YYYY-MM')");

const convert = (
  sqlText: string,
  params: unknown[] | Record<string, unknown> | undefined,
  dialect: 'sqlite' | 'postgres',
): { sql: string; values: unknown[] } => {
  const values: unknown[] = [];
  let sql = dialect === 'postgres' ? toPostgres(sqlText) : sqlText;

  if (params && typeof params === 'object' && !Array.isArray(params)) {
    const indexes = new Map<string, number>();
    sql = sql.replace(/@([A-Za-z_][\w]*)/g, (_match, name: string) => {
      if (dialect === 'postgres') {
        if (!indexes.has(name)) {
          values.push((params as Record<string, unknown>)[name]);
          indexes.set(name, values.length);
        }
        return `$${indexes.get(name)}`;
      }
      values.push((params as Record<string, unknown>)[name]);
      return '?';
    });
  } else {
    const list = (params ?? []) as unknown[];
    let index = 0;
    sql = sql.replace(/\?/g, () => {
      values.push(list[index]);
      index += 1;
      return dialect === 'postgres' ? `$${index}` : '?';
    });
  }

  if (dialect === 'postgres' && /^\s*INSERT\s+INTO\b/i.test(sql) && !/\bRETURNING\b/i.test(sql) && idTables.test(sql)) {
    sql = `${sql.trimEnd()} RETURNING id`;
  }

  return { sql, values };
};

export type RunResult = { changes: number; lastInsertRowid: number };

const makeStatement = (rawSql: string) => ({
  get: async (...params: unknown[]): Promise<any> => {
    const argument =
      params.length === 1 && params[0] && typeof params[0] === 'object' && !Array.isArray(params[0])
        ? (params[0] as Record<string, unknown>)
        : params;
    if (pool) {
      const { sql, values } = convert(rawSql, argument, 'postgres');
      const result = await pool.query(sql, values);
      return result.rows[0];
    }
    const { sql, values } = convert(rawSql, argument, 'sqlite');
    return sqlite!.prepare(sql).get(...values);
  },
  all: async (...params: unknown[]): Promise<any[]> => {
    const argument =
      params.length === 1 && params[0] && typeof params[0] === 'object' && !Array.isArray(params[0])
        ? (params[0] as Record<string, unknown>)
        : params;
    if (pool) {
      const { sql, values } = convert(rawSql, argument, 'postgres');
      const result = await pool.query(sql, values);
      return result.rows;
    }
    const { sql, values } = convert(rawSql, argument, 'sqlite');
    return sqlite!.prepare(sql).all(...values);
  },
  run: async (...params: unknown[]): Promise<RunResult> => {
    const argument =
      params.length === 1 && params[0] && typeof params[0] === 'object' && !Array.isArray(params[0])
        ? (params[0] as Record<string, unknown>)
        : params;
    if (pool) {
      const { sql, values } = convert(rawSql, argument, 'postgres');
      const result = await pool.query(sql, values);
      return {
        changes: result.rowCount ?? 0,
        lastInsertRowid: Number(result.rows?.[0]?.id ?? 0),
      };
    }
    const { sql, values } = convert(rawSql, argument, 'sqlite');
    const info = sqlite!.prepare(sql).run(...values);
    return { changes: info.changes, lastInsertRowid: Number(info.lastInsertRowid) };
  },
});

const addColumnIfMissing = (table: string, column: string, definition: string): void => {
  const columns = sqlite!.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  if (!columns.some((item) => item.name === column)) {
    sqlite!.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
};

const initialiseSqlite = async (): Promise<void> => {
  if (pool || sqlite) return;
  const { default: Database } = await import('better-sqlite3');
  sqlite = new Database(env.dbPath);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');
  sqlite.pragma('busy_timeout = 5000');
  sqlite.exec(schema);
  addColumnIfMissing('church_settings', 'map_lat', "TEXT NOT NULL DEFAULT '-6.7980824'");
  addColumnIfMissing('church_settings', 'map_lng', "TEXT NOT NULL DEFAULT '39.2302042'");
  addColumnIfMissing(
    'church_settings',
    'instagram_url',
    "TEXT NOT NULL DEFAULT 'https://www.instagram.com/dreamerscenter_tz'",
  );
  addColumnIfMissing(
    'church_settings',
    'tiktok_url',
    "TEXT NOT NULL DEFAULT 'https://www.tiktok.com/@dreamerscentre_tz'",
  );
  addColumnIfMissing(
    'church_settings',
    'facebook_url',
    "TEXT NOT NULL DEFAULT 'https://www.facebook.com/DreamerscentreTz'",
  );
  addColumnIfMissing(
    'church_settings',
    'youtube_url',
    "TEXT NOT NULL DEFAULT 'https://www.youtube.com/@thedreamerscentretzchurch'",
  );
  addColumnIfMissing('registrations', 'email', "TEXT NOT NULL DEFAULT ''");
  addColumnIfMissing('registrations', 'phone', "TEXT NOT NULL DEFAULT ''");
  addColumnIfMissing('registrations', 'guardian_phone', "TEXT NOT NULL DEFAULT ''");
};

export const db = {
  prepare: makeStatement,
  exec: async (sqlText: string): Promise<void> => {
    if (pool) {
      await pool.query(toPostgres(sqlText));
      return;
    }
    sqlite!.exec(sqlText);
  },
  init: initialiseSqlite,
  initPostgres: async (): Promise<void> => {
    if (pool) await pool.query(postgresSchema);
  },
  isPostgres: Boolean(pool),
};

export const now = (): string => new Date().toISOString();
