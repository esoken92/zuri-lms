# Zuri LMS (community edition) — agent notes

Self-contained Next.js 16 app. Supabase provides auth + Postgres + RLS.

## Commands

```bash
npm install
npm run dev          # needs .env.local (see .env.example)
npx tsc --noEmit     # typecheck
npx eslint .         # lint
npm run build        # must pass WITHOUT env vars set
node scripts/create-demo-users.mjs   # seeds demo accounts (service key)
```

## Hard rules

- `SUPABASE_SERVICE_ROLE_KEY` is server-only — API routes and scripts,
  never `NEXT_PUBLIC_`, never in the browser bundle.
- `src/lib/supabase-admin.ts` is the only service-role client; lazily
  created so builds pass without env. `src/lib/supabase.ts` must never
  throw at module evaluation.
- RLS is the enforcement layer — every new table needs policies before
  it ships. Client-side guards are UX, not security.
- No telemetry. No `@vercel/analytics`, no outbound analytics calls.
- Migrations are additive — never edit an applied `supabase/migrations/*.sql`.
- Demo mode is `NEXT_PUBLIC_DEMO_MODE` — keep it env-gated.

## Definition of done

- `tsc --noEmit`, `eslint`, `next build` all green (build without env)
- Role gates verified: non-admin users can't reach `/admin` UI or the
  approve/reject API; RLS blocks data either way
- README/ROADMAP claims still match what shipped

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
