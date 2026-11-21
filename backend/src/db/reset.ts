import fs from 'node:fs';
import { env } from '../config/env.js';

for (const suffix of ['', '-wal', '-shm']) {
  const file = `${env.dbPath}${suffix}`;
  if (fs.existsSync(file)) fs.unlinkSync(file);
}
console.log('Database removed. Run `npm run setup` to recreate it with default settings.');
