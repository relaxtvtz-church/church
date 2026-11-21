import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import pg from 'pg';
import { env } from '../config/env.js';
import { postgresSchema } from './postgresSchema.js';

const run = async (): Promise<void> => {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is required to migrate the SQLite database to Postgres.');
  if (!fs.existsSync(env.dbPath)) {
    throw new Error(`SQLite database not found at ${env.dbPath}. Nothing to migrate.`);
  }

  const sqlite = new Database(env.dbPath, { readonly: true });
  const target = new pg.Pool({
    connectionString: url,
    max: 1,
    ssl: { rejectUnauthorized: false },
    allowExitOnIdle: true,
  });

  await target.query(postgresSchema);
  console.log('Postgres schema ready.');

  const upsert = async (table: string, columns: string[], rows: unknown[][]): Promise<void> => {
    if (!rows.length) {
      console.log(`No ${table} rows to migrate.`);
      return;
    }
    const updates = columns.filter((column) => column !== 'id').map((column) => `${column} = EXCLUDED.${column}`);
    const sql = `INSERT INTO ${table} (${columns.join(', ')})\nVALUES ${rows
      .map((_, rowIndex) => `(${columns.map((__, colIndex) => `$${rowIndex * columns.length + colIndex + 1}`).join(', ')})`)
      .join(',\n')}\nON CONFLICT (id) DO UPDATE SET ${updates.join(', ')}`;
    await target.query(sql, rows.flat());
    console.log(`Migrated ${rows.length} ${table} row(s).`);
  };

  const selectRows = (sql: string, columns: string[]): unknown[][] =>
    (sqlite.prepare(sql).all() as Record<string, unknown>[]).map((row) => columns.map((column) => row[column] ?? null));

  const adminColumns = ['id', 'name', 'email', 'password_hash', 'role', 'created_at'];
  await upsert('admins', adminColumns, selectRows(`SELECT ${adminColumns.join(', ')} FROM admins`, adminColumns));

  const staffColumns = ['id', 'full_name', 'position', 'ministry', 'bio', 'photo_url', 'status', 'created_at', 'updated_at'];
  await upsert('staff', staffColumns, selectRows(`SELECT ${staffColumns.join(', ')} FROM staff`, staffColumns));

  const reviewColumns = [
    'id',
    'reviewer_name',
    'phone',
    'staff_id',
    'staff_name',
    'category',
    'rating',
    'message',
    'status',
    'created_at',
  ];
  await upsert('reviews', reviewColumns, selectRows(`SELECT ${reviewColumns.join(', ')} FROM reviews`, reviewColumns));

  const settingColumns = [
    'id',
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
    'updated_at',
  ];
  await upsert(
    'church_settings',
    settingColumns,
    selectRows(`SELECT ${settingColumns.join(', ')} FROM church_settings`, settingColumns),
  );

  const advertColumns = ['id', 'title', 'description', 'university', 'image_url', 'cta_label', 'is_active', 'updated_at'];
  await upsert('advertisement', advertColumns, selectRows(`SELECT ${advertColumns.join(', ')} FROM advertisement`, advertColumns));

  const registrationColumns = [
    'id',
    'full_name',
    'parent_name',
    'email',
    'phone',
    'guardian_phone',
    'location',
    'status',
    'studying_at',
    'university',
    'comments',
    'created_at',
  ];
  await upsert(
    'registrations',
    registrationColumns,
    selectRows(`SELECT ${registrationColumns.join(', ')} FROM registrations`, registrationColumns),
  );

  const uploadDir = path.join(path.dirname(env.dbPath), '..', 'uploads');
  if (fs.existsSync(uploadDir)) {
    const files = fs.readdirSync(uploadDir).filter((file) => /\.(jpg|png|webp|gif)$/i.test(file));
    const uploadRows = files.map((filename) => [
      filename,
      filename.endsWith('.png')
        ? 'image/png'
        : filename.endsWith('.jpg')
          ? 'image/jpeg'
          : filename.endsWith('.webp')
            ? 'image/webp'
            : 'image/gif',
      fs.readFileSync(path.join(uploadDir, filename)),
    ]);
    if (uploadRows.length) {
      const sql = `INSERT INTO uploads (filename, mime_type, data) VALUES ($1, $2, $3)
        ON CONFLICT (filename) DO UPDATE SET mime_type = EXCLUDED.mime_type, data = EXCLUDED.data`;
      for (const row of uploadRows) await target.query(sql, row);
      console.log(`Migrated ${uploadRows.length} upload(s).`);
    }
  }

  for (const table of ['admins', 'staff', 'reviews', 'registrations']) {
    await target.query(`
      SELECT setval(
        pg_get_serial_sequence('${table}', 'id'),
        GREATEST((SELECT COALESCE(MAX(id), 1) FROM ${table}), 1),
        (SELECT COUNT(*) > 0 FROM ${table})
      )
    `);
  }

  sqlite.close();
  await target.end();
  console.log('SQLite to Postgres migration complete.');
};

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
