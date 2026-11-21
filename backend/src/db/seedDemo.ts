import { db, now } from './database.js';
import { seed } from './seed.js';

seed();

const existing = (db.prepare('SELECT COUNT(*) AS count FROM reviews').get() as { count: number }).count;
if (existing > 0) {
  console.log('Demo data skipped: reviews already exist.');
  process.exit(0);
}

const staff = [
  ['Rev. Daniel Mwangi', 'Senior Pastor', 'Word / Preaching', 'Shepherding the church with biblical teaching and pastoral care.'],
  ['Sarah Wanjiku', 'Worship Leader', 'Worship & Praise', 'Leading the congregation into authentic worship.'],
  ['Peter Otieno', 'Youth Minister', 'Leadership', 'Discipling the next generation of dreamers.'],
];

const insertStaff = db.prepare(
  'INSERT INTO staff (full_name, position, ministry, bio, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
);
const insertReview = db.prepare(`
  INSERT INTO reviews (reviewer_name, phone, staff_id, staff_name, category, rating, message, status, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const staffIds: number[] = [];
const staffNames = new Map<number, string>();
const timestamp = now();
for (const [name, position, ministry, bio] of staff) {
  const id = Number(
    insertStaff.run(name, position, ministry, bio, 'active', timestamp, timestamp).lastInsertRowid,
  );
  staffIds.push(id);
  staffNames.set(id, name);
}

const samples = [
  ['Mary A.', staffIds[0], 'Word / Preaching', 5, 'Pastor Daniel’s teaching has helped me understand God’s word in a fresh way. The messages are practical and full of hope.', 'reviewed'],
  [null, staffIds[1], 'Worship & Praise', 5, 'The worship team creates such a warm and prayerful atmosphere. I always leave feeling encouraged.', 'reviewed'],
  ['Joseph K.', staffIds[2], 'Leadership', 4, 'The youth ministry has given my teenagers a place to belong and grow. Very grateful for the patience and care.', 'new'],
  ['Ann N.', null, 'Sunday Service', 4, 'A welcoming church with a genuine sense of community. The service is well organised and easy to follow.', 'new'],
  ['Samuel O.', staffIds[0], 'Leadership', 4, 'Approachable and honest leadership. I appreciate how the church communicates openly with members.', 'new'],
  [null, staffIds[1], 'Worship & Praise', 3, 'Worship was good, though the sound could be a little clearer at the back of the hall.', 'reviewed'],
  ['Faith M.', staffIds[2], 'General Feedback', 5, 'The youth fellowships are lively and meaningful. My children look forward to every Saturday.', 'new'],
  ['David R.', null, 'Church Environment', 5, 'The church grounds and sanctuary are always clean and peaceful. A lovely place to worship.', 'reviewed'],
  ['Esther W.', staffIds[0], 'Word / Preaching', 5, 'The sermon series on hope came at exactly the right time in my life. Thank you for shepherding us well.', 'new'],
  [null, staffIds[1], 'Sunday Service', 4, 'Friendly ushers and a smooth service. The children’s ministry was excellent too.', 'new'],
];

const categories = samples.map((item) => item[2] as string);

const insertMany = db.transaction(() => {
  samples.forEach((sample, index) => {
    const [name, staffId, category, rating, message, status] = sample;
    const staffName = staffId ? (staffNames.get(Number(staffId)) ?? null) : null;
    const date = new Date();
    date.setDate(date.getDate() - (index * 11 + 2));
    insertReview.run(
      name,
      null,
      staffId,
      staffName ?? null,
      category,
      rating,
      message,
      status,
      date.toISOString(),
    );
  });
});

insertMany();
console.log(`Added ${staff.length} demo staff members and ${samples.length} demo reviews.`);
console.log(`Categories used: ${[...new Set(categories)].join(', ')}`);
