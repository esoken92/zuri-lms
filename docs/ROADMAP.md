# Zuri LMS — Release Roadmap

What this repo is: the **community edition** of Zuri LMS — a self-contained
slice of the full Zuri platform, MIT-licensed, sized for a small fleet
(a depot or two). This file is the honest accounting of what shipped,
what's deferred, and what's permanently out of scope for the mini.

## Shipped and working ✅

- **Auth + approvals** — Supabase email/password auth; new sign-ups land as
  `pending` until an admin approves (or rejects) them from `/admin/users`
- **Roles** — `admin` / `manager` / `inspector`, enforced by Postgres RLS
  policies on every table plus server-side checks on the approve/reject
  API routes; the admin UI is additionally gated by role in
  `src/app/admin/layout.tsx`
- **Inspections** — per-position tyre condition logging with photo
  capture and draft auto-save (`/dashboard/inspections`)
- **Scraps** — write-off logging with reason + evidence (`/dashboard/scraps`)
- **Reports & analytics** — inspection/scrap history and trend views
  (`/dashboard/reports`, `/dashboard/analytics`)
- **Admin panel** — users, companies, depots, vehicle configurations,
  tyre register, data import, suggestions, activity logs
- **Geographic model** — countries (SADC-first), provinces, regions,
  stores — seeded from `supabase/seed.sql`
- **Bluetooth sensor panel** — Web Bluetooth reads for compatible tyre
  sensors (`src/components/BluetoothPanel.tsx`); degrades gracefully in
  browsers without BLE
- **Offline draft queue** — inspection drafts persist locally and sync on
  reconnect (`src/lib/offlineSync.ts`, `ConnectionStatus` indicator)
- **Demo mode** — `NEXT_PUBLIC_DEMO_MODE=true` shows seeded demo accounts
  on the login page; `node scripts/create-demo-users.mjs` creates them
- **Branded landing page** — `/` is a public marketing front; the app
  itself lives behind `/login` → `/dashboard`/`/admin`

## Deferred (honest gaps) 🚧

- **Server-side route guarding** — route protection is client-side
  (layouts redirect; RLS enforces data). A `proxy.ts` with a Supabase
  session check would harden UX but isn't required for correctness
- **6-tier role hierarchy** — the legacy roadmap's Administrator →
  Regional → Group → Store → Supervisor → User chain was scoped down to
  the 3-role model above. The tables (`regions`, `stores`) are in place
  for anyone who wants to extend it
- **Password reset flow** — sign-up/sign-in only; reset needs Supabase
  email config (SMTP) — see INTEGRATIONS note below
- **Test suite** — no automated tests yet; verification is manual
  click-through + `tsc`/lint/build
- **Multi-company tenancy** — single-fleet data model; the `companies`
  table exists but row-level isolation per company is not implemented

## Out of scope by design ❌

These belong to the commercial platform, not the community edition:

- Multi-tenant org switching, Stripe billing, module marketplace
- Gate passes, waybills, access control modules
- Cloud telemetry/analytics of any kind (this repo phones nowhere)

## Integrations (bring your own)

| Service | Powers | Required? |
|---|---|---|
| Supabase (free tier or self-hosted) | Auth + Postgres + storage + RLS | ✅ |
| SMTP via Supabase Auth | Password resets, invites | Optional |
| Web Bluetooth-capable browser | Live sensor reads | Optional |

## Release checklist (done before going public)

- [x] Single self-contained Next.js app at repo root
- [x] MIT license
- [x] `.env.example` with every required var documented
- [x] No hardcoded secrets — service key server-side only
- [x] No telemetry (`@vercel/analytics` removed)
- [x] `tsc --noEmit`, `eslint`, `next build` green without env
- [x] Landing page + branded palette
- [x] Demo mode behind env flag
- [x] Role-gated admin surface (UI + API + RLS)
