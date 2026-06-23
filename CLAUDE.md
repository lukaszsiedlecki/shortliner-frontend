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

Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_API_URL` to the backend base URL (default: `http://localhost:8081`).

For Docker: `docker-compose up -d` (reads `.env.docker`).

## Architecture

This is a minimal single-page Next.js 16 app. The entire UI lives in `app/page.tsx` — a `'use client'` component with no routing beyond the root.

**API integration** (`app/page.tsx`):
- `POST {API_URL}/shorten` with `{ "url": "..." }` → returns `{ shortCode, ... }`
- Shortened link resolves at `{API_URL}/shorten/{shortCode}`
- `NEXT_PUBLIC_API_URL` is read at module level; no server-side proxy.

**i18n** (`app/locales/`):
- Translations are plain TypeScript objects in `pl.ts` and `en.ts`, re-exported from `index.ts`.
- `Language` type is derived from the keys of `translations`; `Translation` type is derived from the Polish translation shape.
- The active language is stored in `localStorage` and loaded on mount.
- To add a new language: add a `{locale}.ts` file and register it in `index.ts`.

**Styling**: Tailwind CSS 4 via PostCSS. No `tailwind.config.ts` — configuration is PostCSS-only (`postcss.config.mjs`).

**Build output**: `next.config.ts` sets `output: 'standalone'`, which produces a self-contained Node.js bundle used by the Dockerfile.
