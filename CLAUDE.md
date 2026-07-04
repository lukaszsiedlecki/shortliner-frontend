# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server at http://localhost:3000
npm run build     # Production build (outputs standalone bundle)
npm run start     # Serve the production build
npm run lint      # ESLint check
```

No test suite is configured.

## Environment

Copy `.env.example` to `.env.local` and set `SHORTLINER_BACKEND_URL` and `ANALYTICS_BACKEND_URL` to the backend base URLs (e.g. `http://localhost:8080` and `http://localhost:8082`). These are plain server-side vars read per-request by the Route Handlers in `app/api/*/[[...path]]/route.ts`, not `NEXT_PUBLIC_*` vars — they are not baked into the client bundle, and there is no build-time default: if a var is missing at request time the handler returns a 500 rather than silently falling back anywhere.

For Docker: `docker-compose up -d` (reads `.env.docker`).

## Architecture

This is a minimal single-page Next.js 16 app. The entire UI lives in `app/page.tsx` — a `'use client'` component with no routing beyond the root.

**API integration**:
- The frontend calls same-origin relative paths (`/api/shortliner/...`, `/api/analytics/...`), which are proxied to the real backends by Route Handlers (`app/api/shortliner/[[...path]]/route.ts`, `app/api/analytics/[[...path]]/route.ts`), sharing forwarding logic in `app/api/proxy.ts`. Each handler reads `SHORTLINER_BACKEND_URL` / `ANALYTICS_BACKEND_URL` from `process.env` inside the request handler itself, so the value is resolved fresh per request against the live container environment (internal ClusterIP Service URLs in production) rather than baked in at build time.
  - **Do not use `next.config.ts` `rewrites()` for this.** `next build` resolves rewrite destinations once and bakes them into `.next/routes-manifest.json`; the standalone server serves that manifest as-is and never re-reads `process.env` for it. Since Kubernetes only injects the real backend URL at container start (after the image is already built), a rewrites-based proxy silently freezes in whatever the build-stage env var (or its fallback) happened to be — this was a real bug in this repo (ECONNREFUSED to a baked-in `localhost:8080` in the cluster) and is why Route Handlers are used instead.
- `POST /api/shortliner/shorten` with `{ "url": "..." }` → returns `{ shortCode, ... }` (`app/page.tsx`)
- Shortened link resolves at `/api/shortliner/shorten/{shortCode}`
- An `/api/auth/*` proxy to a future `AUTH_BACKEND_URL` is planned once `shortliner-auth` is deployed — not added yet; follow the same Route Handler pattern, not rewrites.

**i18n** (`app/locales/`):
- Translations are plain TypeScript objects in `pl.ts` and `en.ts`, re-exported from `index.ts`.
- `Language` type is derived from the keys of `translations`; `Translation` type is derived from the Polish translation shape.
- The active language is stored in `localStorage` and loaded on mount.
- To add a new language: add a `{locale}.ts` file and register it in `index.ts`.

**Styling**: Tailwind CSS 4 via PostCSS. No `tailwind.config.ts` — configuration is PostCSS-only (`postcss.config.mjs`).

**Build output**: `next.config.ts` sets `output: 'standalone'`, which produces a self-contained Node.js bundle used by the Dockerfile.
