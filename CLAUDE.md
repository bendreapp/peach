# CLAUDE.md — peach (Frontend)

Next.js frontend for **Bendre**, a privacy-first practice management SaaS for independent therapists in India. Part of a three-repo project (`peach` frontend, `hill` backend, `hq` admin). See the root `../CLAUDE.md` for the full-project overview.

**Stack:** Next.js 15 (App Router, Turbopack) · React 19 · TanStack Query 5 · Tailwind 3 · Supabase SSR · PostHog
**Package name:** `bendre-frontend` · **PM:** pnpm
**GitHub:** bendreapp/peach · **Deploy:** Vercel (dev.bendre.app) — branches `main` (prod), `dev`, `staging`

## Quick Start

```bash
pnpm install
pnpm dev          # next dev --turbopack --port 3035
pnpm build
pnpm start
pnpm lint         # next lint
pnpm typecheck    # tsc --noEmit
```

App runs at http://localhost:3035. Backend API at `NEXT_PUBLIC_API_URL` (default `http://localhost:8095`).

## Structure (`src/`)

```
middleware.ts               → MUST be in src/. Supabase session refresh, route guards, subdomain→/booking/[slug] rewrite
app/
├── layout.tsx / providers.tsx   → React Query, next-themes, Sonner Toaster, PostHog init
├── (marketing)/page.tsx         → Landing + waitlist
├── (auth)/                      → login, signup, onboarding, forgot/reset-password, invite/[token], auth/callback
├── (booking)/                   → Public: [slug], booking/[slug], intake, onboard/[token]
├── (dashboard)/                 → Protected: dashboard, clients, schedule, leads, broadcast, payments, recurring, team, messages, settings
├── (portal)/portal/            → Protected client portal
├── access-locked/              → Shown on PLAN_INACTIVE
└── api/                        → auth/google/callback, auth/zoom/callback, waitlist-notify
lib/
├── api.ts                  → fetch wrapper; ApiClientError; PLAN_INACTIVE → redirect /access-locked
├── api-hooks.ts            → React Query hooks (useTherapistMe, useClientsList, useSessions*, mutations) + PostHog events
├── date-utils.ts           → IST utilities
├── country-codes.ts
└── supabase/{client,server}.ts  → @supabase/ssr browser + server clients
components/                 → ui/, booking/, schedule/, client-detail/, notes/, settings/, treatment-plan/, resources/, portal/, intake/, forms/, dashboard/
styles/globals.css          → Satoshi font, CSS variables (light/dark), utility classes
```

**Shared package:** `@bendre/shared` (`./shared/` — Zod schemas/constants, transpiled via next.config).

## Config

- **next.config.ts** — transpiles `@bendre/shared`; Supabase remote images; `optimizePackageImports` (lucide-react, react-query, recharts); PostHog `/ingest/*` rewrite; security headers.
- **tailwind.config.ts** — theme via CSS vars; class-based dark mode; custom radii/shadows/animations.
- **tsconfig.json** — `@/*` → `src/*`, `@bendre/shared` alias; `strict: false`.

## Conventions

- **All dates/times are IST** (Asia/Kolkata) — use `lib/date-utils.ts`.
- **API calls:** always go through `lib/api.ts` / `lib/api-hooks.ts`. Auth = Supabase JWT as Bearer. Query cache: staleTime 5min, gcTime 10min, no refetch on focus/reconnect, 1 retry. Mutations fire PostHog events on success.
- **Auth guard** lives in `src/middleware.ts`. Protected: `/dashboard/*`, `/settings/*`, `/portal/*`, `/onboarding`, `/access-locked`. Unauth → `/login/therapist` or `/login/client`.
- **Onboarding detection:** check `phone IS NULL` (slug is always auto-set by the DB trigger).
- **Font:** Satoshi everywhere. **Icons:** lucide-react. **Toasts:** Sonner, bottom-right, rich colors.
- **Colors:** sage-green brand (`--color-primary #5C7A6B`, accent `#8FAF8A`, danger terracotta `#C0705A`); use CSS-variable tokens (`bg-card`, `text-ink`, `.btn-primary`, `.ui-card`, `.badge`) — don't hardcode hex.
- **PostHog** disabled in local dev (avoids header-size errors).
- **Errors:** React Query error states + `ApiClientError` (carries `code`, `status`, `planStatus`).

## Environment (`.env.local` — see `.env.example`)

```
NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_API_URL=http://localhost:8095      # or https://hill-goeg.onrender.com
NEXT_PUBLIC_APP_URL / NEXT_PUBLIC_APP_DOMAIN
NEXT_PUBLIC_POSTHOG_KEY
GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_REDIRECT_URI (+ NEXT_PUBLIC_GOOGLE_CLIENT_ID)
ZOOM_CLIENT_ID / ZOOM_CLIENT_SECRET / ZOOM_REDIRECT_URI (+ NEXT_PUBLIC_ZOOM_CLIENT_ID)
RESEND_API_KEY / NEXT_PUBLIC_BENDRE_UPI
```

## Rules

- **Never take shortcuts** — implement features properly (right tables, clean layers). No hacks/workarounds.
- **Read before writing** — understand existing patterns before adding to them.
- **No placeholder/half-broken implementations** — document and skip instead.
