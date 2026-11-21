# Dreamers Centre Fellowship — Ministry Review Portal

A simple, private feedback and staff review portal for **The Dreamers Centre Fellowship**.

Visitors submit feedback from the public website, choose a staff member (or general church feedback), give a 1–5 star rating and write a review. Administrators sign in to a private dashboard to read and organise feedback, manage staff, see live ratings, update church information and export branded PDF reports.

## Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS 4, Vite, React Router, Lucide icons
- **Backend:** Node.js, Express, TypeScript; SQLite (`better-sqlite3`) locally, PostgreSQL (`pg`) on Vercel
- **Auth:** httpOnly cookie sessions, bcrypt password hashing, protected API routes
- **PDF:** PDFKit, generated on the server with church branding and page numbers
- **Database choice:** SQLite for local development; PostgreSQL (Supabase transaction pooler) in production. Setting `DATABASE_URL` switches the API to Postgres automatically.

## Quick start

```bash
cd church
cp .env.example .env          # optional but recommended; change secrets before deploying
npm install
npm run setup                 # creates the database, default admin and church settings
npm run seed:demo             # optional: 4 sample staff + 12 sample reviews for exploring the UI
npm run dev                   # API on :4000, website on :5173
```

Open:

- Public website: <http://localhost:5173>
- Admin portal (no public link): <http://localhost:5173/admin> — unauthenticated visits see the sign-in page at that same URL.

Default administrator (from `.env.example`, already seeded into the database):

```
Email:    shorahgodfrey@gmail.com
Password: Godfrey12@[][]
```

Change this in `.env` before reseeding, or after signing in via **Settings → Change password**. The password is stored in the database as a bcrypt hash, never in plain text.

### Production-style run

```bash
npm run build
npm start                     # serves the built frontend and API together on :4000
```

### Vercel deployment

The Vercel project builds the frontend and backend together. `vercel.json` sends `/api/*` and `/uploads/*` to the Express serverless function and serves the Vite build for everything else. Uploaded images are stored in the `uploads` Postgres table, so they survive cold starts.

Required Vercel environment variables:

| Name | Notes |
| --- | --- |
| `DATABASE_URL` | Supabase **transaction pooler** connection string (port `6543`). |
| `SESSION_SECRET` | Long random string. |
| `ALLOWED_ORIGIN` | The public deployment URL. |
| `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Administrator credentials. |
| `NODE_ENV` | `production`. |

To copy the existing local SQLite data into Postgres once, run:

```bash
DATABASE_URL='postgresql://...' npm run db:migrate --workspace backend
```

The migration is idempotent and also copies uploaded images into the `uploads` table.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Run API and frontend with hot reload |
| `npm run build` | Type-check and build the frontend into `frontend/dist` |
| `npm start` | Run the API and serve the built frontend |
| `npm run setup` | Create tables, default admin and church settings |
| `npm run seed:demo` | Add sample staff and reviews (skipped if reviews already exist) |
| `npm run db:reset` | Delete the local database file so it can be recreated |
| `npm run db:migrate --workspace backend` | Copy local SQLite data and uploads into Postgres (`DATABASE_URL` required) |
| `npm run build:backend` | Compile the Express backend for the Vercel serverless function |
| `npm run vercel-build` | Build frontend, backend and brand assets for Vercel |
| `npm run typecheck` (in `backend/` or `frontend/`) | Type-check without building |

## Project structure

```
church/
├── backend/
│   └── src/
│       ├── config/            Environment configuration
│       ├── db/                Schema, seed, demo data, reset
│       ├── middleware/        Auth, validation, uploads, rate limiting, errors
│       ├── modules/
│       │   ├── advertise/     Public announcement and registration endpoints
│       │   ├── auth/          Login, logout, session and password endpoints
│       │   ├── reports/       PDF generation and report/preview endpoints
│       │   ├── reviews/       Public submission + admin review management
│       │   ├── settings/      Public and admin church information
│       │   ├── staff/         Staff CRUD and rating profiles
│       │   ├── stats/         Dashboard aggregates
│       │   └── uploads/       Authenticated image uploads
│       └── utils/             Sanitisation, formatting, query parsing
└── frontend/
    └── src/
        ├── components/
        │   ├── admin/         Admin-only page helpers
        │   ├── brand/         Church logo / mark
        │   ├── charts/        Lightweight SVG/CSS charts
        │   ├── layout/        Public and admin layouts, route guard
        │   ├── public/        Rating input and join/registration section
        │   └── ui/            Reusable buttons, fields, modals, states
        ├── lib/               API client, auth, settings and toast contexts
        ├── pages/
        │   ├── admin/         Overview, Reviews, Staff, Ratings, Reports, Advertise, Settings
        │   └── public/        Home / feedback form
        └── types.ts
```

## Notes

- **Branding:** the supplied `dreamers-logo-transparent.png` is preloaded as the church logo and `IMG-20261120-WA0000.jpg` is used as the public hero banner. Both are bundled in `frontend/public/brand/`. A new logo can be uploaded under **Church Information → Church logo**; it then appears in the public header, form, admin portal and PDF reports. Brand colours are defined as CSS variables in `frontend/src/index.css` and mirrored for PDFs in `backend/src/config/theme.ts`.
- **Shusho spotlight:** the home page includes a rotating “Pastor Christina Shusho” slide taken from `dreamers-centre-studio.html` only — 100 quotes (English + Swahili) and the six embedded portrait images, saved under `frontend/public/brand/shusho-*.jpg`. No other studio tabs were imported. The slide is a contained **4:3 presentation card** (`max-width: 900px`, `overflow-hidden`) with a full-width background image; the mood, theme, counter, **Next word** button and **New tab** link all sit inside the slide. `New tab` opens `/shusho` as a standalone slide page. It changes automatically every 6.5 seconds.
- **Brand palette:** the exact studio colours (`#0A2A6E` navy, `#1A6BC4` eagle blue, `#C8960C` gold, `#F0C040` light gold, `#F5EFE0` cream, `#FAF6EC` paper) are defined in `frontend/src/index.css` and mirrored in `backend/src/config/theme.ts` for PDFs.
- **Registered People:** admin sidebar → **Registered People** (`/admin/registrations`) lists every freshers registration with search, date filters, refresh and delete. **Export PDF** produces a branded, landscape PDF with totals, contact details, comments and page numbers. The same export is available from **Reports → Registered people** and from **Advertise → Export PDF**.
- **Live public data:** Church Information, the public team dropdown and the join-us poster are fetched from the API (SQLite locally, Postgres in production). The public home, admin overview, reviews and registrations all refetch automatically when you return to their tab, so submissions and admin edits appear without a manual reload.
- **Church details:** the public footer, Google Map, contact phone and official social links are all driven by **Church Information** in the admin portal. Defaults are Manzese Tiptop, Dar es Salaam (`-6.7980824, 39.2302042`), `+255 621 585 025`, and the supplied Instagram, TikTok, Facebook and YouTube profiles. Extra branded artwork lives in `frontend/public/brand/` as lightweight SVGs.
- **Privacy:** names and phone numbers are optional. Reviews are only available through authenticated admin endpoints. Submitted text is stripped of markup before storage and rendered escaped by React.
- **Rate limiting:** public submissions are limited to 5 per 30 minutes per IP; login attempts are limited to 12 per 15 minutes per IP and identifier.
- **Historical reviews:** deleting or deactivating staff never deletes their reviews. Each review stores a snapshot of the staff name at submission time.
- **PDF reports:** all reviews, staff-filtered, monthly, custom date range, staff rating summary and church feedback summary. Reports respect the filters selected on the Reports page; the Reviews page export button carries the active review filters across.
- **Advertise / freshers:** the admin **Advertise** page edits the public join-us poster, title, description, university / where-you're-from highlight, button text and visibility. The public section is anchored at `/#freshers`. Interested people submit a registration form (full name, parent/guardian name, email, their phone, guardian phone, location, status, where studying, university/from and comments); submissions are listed and searchable in the same admin page. The review dropdown is fetched from the database and includes the ministry departments **Praise team**, **Worship team**, **Dreamers choir** and **Heavenly kids** alongside active staff members. Departments are review targets only and are hidden from the public “Meet the team” cards.
