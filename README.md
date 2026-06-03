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

## Deploy to Vercel (recommended)

1. Push this repo to GitHub (see below).
2. Go to [vercel.com/new](https://vercel.com/new).
3. **Import** your GitHub repository.
4. Framework preset: **Next.js** (auto-detected).
5. Click **Deploy** — no env vars required for the demo.

Optional: add `TABANG_USE_MEMORY=1` in Vercel env to force in-memory storage locally.

## Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit: Tabang Daet emergency reporting system"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/tabang-daet.git
git push -u origin main
```

Create the empty repo first on GitHub: **New repository** → name `tabang-daet` → do not add README.

## Project structure

```
src/app/          # Pages (citizen, dispatcher, responder)
src/app/api/      # Incident REST API
src/components/   # Map, shell, login UI
src/lib/          # Business logic, triage, persistence
data/             # Local incident JSON (dev only)
```

## Author

Rue Martine Nicholson A. Abando — BSIT 2B
