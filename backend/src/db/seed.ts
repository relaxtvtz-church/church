import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';
import { db, now } from './database.js';

const seedDepartments = async (): Promise<void> => {
  const departments = [
    ['Praise team', 'Serving the congregation through praise and worship.'],
    ['Worship team', 'Leading the church into heartfelt worship.'],
    ['Dreamers choir', 'Glorifying God through choral ministry.'],
    ['Heavenly kids', 'Nurturing children in faith and joy.'],
  ];
  const timestamp = now();
  for (const [name, bio] of departments) {
    const existing = await db.prepare('SELECT id FROM staff WHERE full_name = ?').get(name);
    if (!existing) {
      await db
        .prepare(
          `INSERT INTO staff (full_name, position, ministry, bio, status, created_at, updated_at)
           VALUES (?, '', 'Department', ?, 'active', ?, ?)`,
        )
        .run(name, bio, timestamp, timestamp);
    }
  }
};

export const seed = async (): Promise<void> => {
  if (db.isPostgres) await db.initPostgres();
  await seedDepartments();

  const adminCount = (await db.prepare('SELECT COUNT(*) AS count FROM admins').get()) as { count: number };

  if (adminCount.count === 0) {
    const passwordHash = bcrypt.hashSync(env.admin.password, 12);
    await db
      .prepare('INSERT INTO admins (name, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)')
      .run(env.admin.name, env.admin.email.toLowerCase(), passwordHash, 'super_admin', now());
    console.log(`Created admin: ${env.admin.email}`);
  }

  const settingsCount = (await db.prepare('SELECT COUNT(*) AS count FROM church_settings WHERE id = 1').get()) as {
    count: number;
  };

  if (settingsCount.count === 0) {
    await db.prepare('INSERT INTO church_settings (id, updated_at) VALUES (1, ?)').run(now());
    console.log('Created default church settings');
  }

  const advertCount = (await db.prepare('SELECT COUNT(*) AS count FROM advertisement WHERE id = 1').get()) as {
    count: number;
  };

  if (advertCount.count === 0) {
    await db.prepare('INSERT INTO advertisement (id, updated_at) VALUES (1, ?)').run(now());
    console.log('Created default advertisement');
  }
};

if (process.argv[1]?.endsWith('seed.ts')) {
  seed()
    .then(() => console.log('Database ready.'))
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
}
