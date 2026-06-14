# Macro Tracker

A mobile-first PWA for tracking daily macros (calories, protein, carbs, fat) and
hitting your goals. Built with Next.js + React, deployed for free on GitHub Pages.

**Live app:** https://erick-andraga.github.io/macro-tracker/

## Features

- **Today** — calorie ring + protein/carbs/fat progress bars vs. your goals,
  with a floating popup to quickly log foods (and create new ones inline).
- **Foods** — searchable food library with sample data; add your own foods.
- **History** — month calendar showing logged days; tap a day for its breakdown.
- **Profile** — age, sex, weight (lb/kg), height (cm/in), and activity level.
  Calculates daily calorie target via the **Mifflin-St Jeor** equation
  (BMR → TDEE → goal) and a 30/40/30 macro split for cut / maintain / bulk.

## Tech stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- Plain CSS (dark charcoal UI, blue accent), mobile-first, PWA manifest
- **localStorage** persistence (Supabase database + auth integration in progress)
- Static export (`output: "export"`) hosted on **GitHub Pages**

## Getting started

Requires Node.js 20+.

```bash
npm install
npm run dev      # http://localhost:3000
```

## Building

```bash
npm run build    # static export to ./out
```

## Deployment

Every push to `main` triggers [.github/workflows/deploy.yml](.github/workflows/deploy.yml),
which builds the static export (with the `/macro-tracker/` base path) and publishes
it to GitHub Pages.

## Auth & database (Supabase)

The app uses Supabase for Google sign-in and per-user data. Without keys it runs
in local-only mode (localStorage, no login), so it always works.

**Setup:**

1. Create a free project at [supabase.com](https://supabase.com).
2. In the **SQL Editor**, run [`supabase/schema.sql`](supabase/schema.sql) to
   create the `profiles`, `foods`, and `entries` tables (with row-level security).
3. **Authentication → Providers → Google**: enable it and add your Google OAuth
   client ID/secret (from Google Cloud Console).
4. **Authentication → URL Configuration**: add the site URL
   `https://erick-andraga.github.io/macro-tracker/` and the same as a redirect URL.
5. Local dev: copy `.env.local.example` to `.env.local` and fill in
   **Project Settings → API** (Project URL + anon public key).
6. Production: add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   as repo **Variables** (Settings → Secrets and variables → Actions → Variables).
   The deploy workflow injects them at build time. The anon key is safe to expose;
   data is protected by row-level security.

Sessions persist in the browser and auto-refresh, so you stay signed in on your
phone across app opens.

## Project structure

```
app/                 Routes: Today (/), foods, calendar, profile
components/          TabBar, Modal, MacroDisplay, AddFoodForm, QuickLogModal
lib/                 types, macros (Mifflin-St Jeor + units), store, sampleData
public/             PWA manifest + icons
```

## Architecture notes

State and persistence are isolated in `lib/store.tsx` so the storage layer can be
swapped (localStorage → Supabase) by changing a single file.
