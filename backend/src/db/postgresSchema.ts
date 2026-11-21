const ts = `to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')`;

export const postgresSchema = `
CREATE TABLE IF NOT EXISTS admins (
  id            BIGSERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  created_at    TEXT NOT NULL DEFAULT ${ts}
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_admins_email_lower ON admins (lower(email));

CREATE TABLE IF NOT EXISTS staff (
  id         BIGSERIAL PRIMARY KEY,
  full_name  TEXT NOT NULL,
  position   TEXT NOT NULL DEFAULT '',
  ministry   TEXT NOT NULL DEFAULT '',
  bio        TEXT NOT NULL DEFAULT '',
  photo_url  TEXT,
  status     TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TEXT NOT NULL DEFAULT ${ts},
  updated_at TEXT NOT NULL DEFAULT ${ts}
);

CREATE TABLE IF NOT EXISTS reviews (
  id            BIGSERIAL PRIMARY KEY,
  reviewer_name TEXT,
  phone         TEXT,
  staff_id      BIGINT REFERENCES staff(id) ON DELETE SET NULL,
  staff_name    TEXT,
  category      TEXT NOT NULL,
  rating        INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  message       TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'archived')),
  created_at    TEXT NOT NULL DEFAULT ${ts}
);

CREATE TABLE IF NOT EXISTS church_settings (
  id               INTEGER PRIMARY KEY CHECK (id = 1),
  church_name      TEXT NOT NULL DEFAULT 'The Dreamers Centre Fellowship',
  logo_url         TEXT DEFAULT '/brand/dreamers-logo-transparent.png',
  location         TEXT NOT NULL DEFAULT 'Manzese Tiptop, Dar es Salaam, Tanzania',
  phone            TEXT NOT NULL DEFAULT '+255 621 585 025',
  email            TEXT NOT NULL DEFAULT '',
  map_lat          TEXT NOT NULL DEFAULT '-6.7980824',
  map_lng          TEXT NOT NULL DEFAULT '39.2302042',
  instagram_url    TEXT NOT NULL DEFAULT 'https://www.instagram.com/dreamerscenter_tz',
  tiktok_url       TEXT NOT NULL DEFAULT 'https://www.tiktok.com/@dreamerscentre_tz',
  facebook_url     TEXT NOT NULL DEFAULT 'https://www.facebook.com/DreamerscentreTz',
  youtube_url      TEXT NOT NULL DEFAULT 'https://www.youtube.com/@thedreamerscentretzchurch',
  welcome_message  TEXT NOT NULL DEFAULT 'We value your experience at The Dreamers Centre Fellowship. Your feedback helps us strengthen our ministry, improve our fellowship, and serve our community better.',
  feedback_intro   TEXT NOT NULL DEFAULT 'Share your experience, encourage our leaders, and help us serve you better. Your feedback is reviewed by the ministry leadership team.',
  footer_text      TEXT NOT NULL DEFAULT 'A community of dreamers, growing together in faith and service.',
  service_info     TEXT NOT NULL DEFAULT '',
  updated_at       TEXT NOT NULL DEFAULT ${ts}
);

CREATE TABLE IF NOT EXISTS advertisement (
  id          INTEGER PRIMARY KEY CHECK (id = 1),
  title       TEXT NOT NULL DEFAULT 'Join the Dreamers Centre Fellowship',
  description TEXT NOT NULL DEFAULT 'Are you new here, or looking for a church family to grow with? Register your interest and our leadership team will gladly get in touch with you.',
  university  TEXT NOT NULL DEFAULT '',
  image_url   TEXT DEFAULT '/brand/church-banner.jpg',
  cta_label   TEXT NOT NULL DEFAULT 'Register your interest',
  is_active   INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  updated_at  TEXT NOT NULL DEFAULT ${ts}
);

CREATE TABLE IF NOT EXISTS registrations (
  id             BIGSERIAL PRIMARY KEY,
  full_name      TEXT NOT NULL,
  parent_name    TEXT NOT NULL,
  email          TEXT NOT NULL DEFAULT '',
  phone          TEXT NOT NULL DEFAULT '',
  guardian_phone TEXT NOT NULL DEFAULT '',
  location       TEXT NOT NULL,
  status         TEXT NOT NULL,
  studying_at    TEXT NOT NULL DEFAULT '',
  university     TEXT NOT NULL DEFAULT '',
  comments       TEXT NOT NULL DEFAULT '',
  created_at     TEXT NOT NULL DEFAULT ${ts}
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  admin_id   BIGINT NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS rate_limits (
  key       TEXT PRIMARY KEY,
  count     INTEGER NOT NULL DEFAULT 0,
  reset_at  BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS uploads (
  filename   TEXT PRIMARY KEY,
  mime_type  TEXT NOT NULL,
  data       BYTEA NOT NULL,
  created_at TEXT NOT NULL DEFAULT ${ts}
);

CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_staff_id ON reviews(staff_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);
CREATE INDEX IF NOT EXISTS idx_reviews_category ON reviews(category);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_staff_status ON staff(status);
CREATE INDEX IF NOT EXISTS idx_registrations_created_at ON registrations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_sessions_admin_id ON sessions(admin_id);
`;
