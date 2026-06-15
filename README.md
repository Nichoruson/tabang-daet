# Tabang Daet

**Real-Time Community Emergency Reporting System** for Daet, Camarines Norte — a portfolio project connecting citizens with MDRRMO / C-HEMS through GPS reporting, live photo validation, dispatcher triage, and field responder status sync.

![Next.js](https://img.shields.io/badge/Next.js-16-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Tests](https://img.shields.io/badge/tests-20_passing-green)

## Live demo

After deploying to Vercel, your app will be at:

`https://<your-project>.vercel.app`

> **Note:** On Vercel, incident data is stored in server memory (resets when the server cold-starts). Perfect for portfolio demos; use a database for production.

## Features

- **Citizen** — OTP/Google sign-in, one-tap emergency categories, GPS + draggable map pin, camera-only photo, offline queue
- **Dispatcher** — Live map, smart triage, validate → dispatch → resolve workflow
- **Responder** — Assignment view, field status buttons, citizen notification timeline
- **API** — REST endpoints at `/api/incidents`

## Demo logins

| Role | Credentials |
|------|-------------|
| Citizen | Phone OTP: **`123456`** (any name/phone) or Google button |
| Dispatcher | `mdrrmo` / `tabang2026` |
| Responder | `responder` / `field2026` |

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm test          # unit tests
npm run build     # production build
```

On Windows PowerShell, if `npm` is blocked:

```powershell
npm.cmd run dev
```

<<<<<<< HEAD
## Database & OTP Configuration

The application uses **Prisma ORM** with **PostgreSQL** (e.g. Supabase, Neon, or Vercel Postgres) for persistence.

### 1. Environment Variables (`.env`)
Create a `.env` file in the root directory:

```env
# Database connection string (e.g., from Supabase or Neon)
DATABASE_URL="postgresql://username:password@hostname:5432/dbname?schema=public"

# Twilio SMS credentials (optional - fellback to console log in development)
TWILIO_ACCOUNT_SID="your_account_sid"
TWILIO_AUTH_TOKEN="your_auth_token"
TWILIO_PHONE_NUMBER="+1xxxxxxxxxx"
```

### 2. Local Database & Migrations
To initialize the database schema, run:
```bash
npx prisma migrate dev --name init
```

*Note: For local-only development without PostgreSQL, you can change the provider to `sqlite` and url to `file:./dev.db` in `prisma/schema.prisma` and run `npx prisma migrate dev`.*

## Deploy to Vercel (recommended)

1. Push this repo to GitHub (see below).
2. Go to [vercel.com/new](https://vercel.com/new).
3. **Import** your GitHub repository.
4. Framework preset: **Next.js** (auto-detected).
5. Add your environment variables (`DATABASE_URL`, and optionally Twilio keys) in the Vercel project settings.
6. Click **Deploy**.
=======


>>>>>>> 6a783224e93eacfd7a00a284b8fe292670538a21


## Author

Rue Martine Nicholson A. Abando 
