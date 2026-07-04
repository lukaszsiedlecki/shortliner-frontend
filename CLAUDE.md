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

Copy `.env.example` to `.env.local` and set `SHORTLINER_BACKEND_URL` and `ANALYTICS_BACKEND_URL` to the backend base URLs (defaults: `http://localhost:8080` and `http://localhost:8082`). These are plain server-side vars read at runtime by `next.config.ts`, not `NEXT_PUBLIC_*` vars — they are not baked into the client bundle at build time.

For Docker: `docker-compose up -d` (reads `.env.docker`).

## Architecture

This is a minimal single-page Next.js 16 app. The entire UI lives in `app/page.tsx` — a `'use client'` component with no routing beyond the root.

**API integration**:
- The frontend calls same-origin relative paths (`/api/shortliner/...`, `/api/analytics/...`); `next.config.ts` `rewrites()` proxies these server-side to `SHORTLINER_BACKEND_URL` / `ANALYTICS_BACKEND_URL` (internal ClusterIP services in production, so this only works because the app runs as a real Node server, not a static export).
- `POST /api/shortliner/shorten` with `{ "url": "..." }` → returns `{ shortCode, ... }` (`app/page.tsx`)
- Shortened link resolves at `/api/shortliner/shorten/{shortCode}`
- An `/api/auth/*` rewrite to a future `AUTH_BACKEND_URL` is planned once `shortliner-auth` is deployed — not added yet.

**i18n** (`app/locales/`):
- Translations are plain TypeScript objects in `pl.ts` and `en.ts`, re-exported from `index.ts`.
- `Language` type is derived from the keys of `translations`; `Translation` type is derived from the Polish translation shape.
- The active language is stored in `localStorage` and loaded on mount.
- To add a new language: add a `{locale}.ts` file and register it in `index.ts`.

**Styling**: Tailwind CSS 4 via PostCSS. No `tailwind.config.ts` — configuration is PostCSS-only (`postcss.config.mjs`).

**Build output**: `next.config.ts` sets `output: 'standalone'`, which produces a self-contained Node.js bundle used by the Dockerfile.
