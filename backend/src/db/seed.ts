import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';
import { db, now } from './database.js';

const seedDepartments = (): void => {
  const departments = [
    ['Praise team', 'Serving the congregation through praise and worship.'],
    ['Worship team', 'Leading the church into heartfelt worship.'],
    ['Dreamers choir', 'Glorifying God through choral ministry.'],
    ['Heavenly kids', 'Nurturing children in faith and joy.'],
  ];
  const timestamp = now();
  const insert = db.prepare(`
    INSERT INTO staff (full_name, position, ministry, bio, status, created_at, updated_at)
    SELECT ?, '', 'Department', ?, 'active', ?, ?
    WHERE NOT EXISTS (SELECT 1 FROM staff WHERE full_name = ?)
  `);
  for (const [name, bio] of departments) {
    insert.run(name, bio, timestamp, timestamp, name);
  }
};

export const seed = (): void => {
  seedDepartments();

  const adminCount = (db.prepare('SELECT COUNT(*) AS count FROM admins').get() as { count: number }).count;

  if (adminCount === 0) {
    const passwordHash = bcrypt.hashSync(env.admin.password, 12);
    db.prepare(
      'INSERT INTO admins (name, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)',
    ).run(env.admin.name, env.admin.email.toLowerCase(), passwordHash, 'super_admin', now());
    console.log(`Created admin: ${env.admin.email}`);
  }

  const settingsCount = (
    db.prepare('SELECT COUNT(*) AS count FROM church_settings WHERE id = 1').get() as { count: number }
  ).count;

  if (settingsCount === 0) {
    db.prepare('INSERT INTO church_settings (id, updated_at) VALUES (1, ?)').run(now());
    console.log('Created default church settings');
  }

  const advertCount = (
    db.prepare('SELECT COUNT(*) AS count FROM advertisement WHERE id = 1').get() as { count: number }
  ).count;

  if (advertCount === 0) {
    db.prepare('INSERT INTO advertisement (id, updated_at) VALUES (1, ?)').run(now());
    console.log('Created default advertisement');
  }
};

if (process.argv[1]?.endsWith('seed.ts')) {
  seed();
  console.log('Database ready.');
}
