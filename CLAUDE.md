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

**Auth** (`app/auth.tsx`, `lib/api.ts`):
- In the cluster `shortliner-gateway` (Spring Cloud Gateway BFF) sits in front of both this app and the backends: it serves `/api/<svc>/**`, `/api/me`, `/oauth2/**`, `/login/**`, `/logout` itself and forwards everything else to Next.js. The Route Handlers above are only a fallback until the gateway is live; they can be removed afterwards.
- The frontend never sees or stores a token — no OAuth/OIDC library, no `NEXT_PUBLIC_*` auth config.
- Use `apiFetch` (`lib/api.ts`) for all API calls: it sends `credentials: 'same-origin'` and, on non-GET/HEAD, the `X-XSRF-TOKEN` header from the `XSRF-TOKEN` cookie (missing → gateway answers 403).
- Auth state comes from `GET /api/me` (always 200, `{authenticated, id, username, email, name}`) via `MeProvider`/`useMe()`; if it fails (no gateway) the user is treated as anonymous.
- Log in = full-page navigation to `/oauth2/authorization/keycloak`; log out = HTML form POST to `/logout` with a `_csrf` field. Never `fetch` either — both are cross-origin redirect chains.
- Protected API calls return 401 (no redirect) when not logged in or the session expired → show `LoginPrompt`.
- Never log cookies, the CSRF token or `/api/me` response bodies.
- Local login testing: run the gateway locally (`http://localhost:8084`, `FRONTEND_URL=http://localhost:3000`) and browse :8084, not :3000.

**Observability** (`lib/`, `instrumentation.ts`):
- Server-side logs go through `lib/logger.ts` (pino, no transport): one JSON object per line on stdout with string `level`, `message`, ISO `time`. Proxy requests log `method`, `path`, `route`, `status`, `durationMs`, `traceId`. Next.js's own startup banner remains plain text.
- Prometheus metrics (`lib/metrics.ts`, singleton on `globalThis` because Next bundles instrumentation and Route Handlers separately) are served by a separate `http.createServer` on `METRICS_PORT` (default `9091`) at `/metrics`, started from `instrumentation.ts`. **Never expose metrics as a Next.js route** — port 3000 is public via the Ingress.
- `http_server_requests_seconds` histogram labels: `route` (template like `/api/shortliner/*`, never raw paths — short codes are unbounded), `method`, `status`.
- The proxy forwards the incoming W3C `traceparent` or creates a new one, so backend traces start at the edge.

**i18n** (`app/locales/`):
- Translations are plain TypeScript objects in `pl.ts` and `en.ts`, re-exported from `index.ts`.
- `Language` type is derived from the keys of `translations`; `Translation` type is derived from the Polish translation shape.
- The active language is stored in `localStorage` and loaded on mount.
- To add a new language: add a `{locale}.ts` file and register it in `index.ts`.

**Styling**: Tailwind CSS 4 via PostCSS. No `tailwind.config.ts` — configuration is PostCSS-only (`postcss.config.mjs`).
- Dark mode is class-based (`@custom-variant dark` in `app/globals.css`), **dark by default**: `<html className="dark">` in `layout.tsx`, and an inline `<head>` script (`themeInitScript` in `app/theme.tsx`) removes it before first paint if `localStorage.theme === 'light'`. `ThemeToggle` flips the class and saves the choice. Every light colour class needs a `dark:` counterpart.

**Build output**: `next.config.ts` sets `output: 'standalone'`, which produces a self-contained Node.js bundle used by the Dockerfile.
