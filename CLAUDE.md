# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start Vite dev server with HMR
npm run build     # TypeScript compile (tsc -b) + Vite production bundle
npm run preview   # Serve production build locally
npm run lint      # Run ESLint
```

No test framework is configured. The `testsprite_tests/` directory contains auto-generated tests via MCP.

## Architecture

**FeedbackFlow** is a React 19 + TypeScript + Vite SPA. It's a SaaS product for collecting anonymous customer feedback via QR codes, with Supabase as the backend and Stripe for subscriptions.

### Routing (`src/App.tsx`)

React Router v7 with route-level code splitting (`React.lazy` + `Suspense`). Custom wrapper components control access:
- `PrivateRoute` — requires authenticated user
- `PublicRoute` — redirects authenticated users away (login/register)
- `PlansRoute` — redirects users who already have a plan

Key routes: `/` (landing), `/login`, `/register`, `/dashboard`, `/onboarding`, `/plans`, `/feedback/:businessId` (public form), `/blog`.

### Auth (`src/hooks/useAuth.tsx`)

Single large file (~15k lines) that manages the entire auth lifecycle via React Context (`AuthProvider` wraps the whole app). Handles: Supabase session init, token refresh, Google OAuth, email verification, password reset. It includes a native REST API fallback to bypass Supabase client locks under React 19 Strict Mode.

Access auth state anywhere with `useAuth()` — returns `{ user, isAuthenticated, isLoading, login, loginWithGoogle, register, logout, ... }`.

### State Management

No Redux or Zustand. All state is React Context + custom hooks:
- `useAuth` (Context) — global auth & user session
- `useBusiness` — Supabase queries for the current business
- `useComments` — Supabase queries for feedback comments
- `useTheme` — dark/light mode persistence via localStorage

### Data Layer

`src/lib/supabase.ts` exports the Supabase client. Hooks query Supabase directly — no separate API layer. Soft deletes use an `is_deleted` boolean flag on records.

Key Supabase tables inferred from code: `businesses`, `comments` (feedback entries).

### Component Structure

- `src/components/ui/` — shadcn/ui components (Radix UI primitives, ~67 files). Don't modify these unless adding new shadcn components.
- `src/components/landing/` — Landing page section components
- `src/sections/` — Full-page route components. `DashboardPage.tsx` is ~3,200 lines and handles statistics, QR codes, comment management, and settings.
- `src/types/index.ts` — Central TypeScript type definitions

### Styling

Tailwind CSS 3 with CSS variable-based theming. Dark mode is class-based (`next-themes`). Three distinct themes: light, dark, and a landing-page purple/indigo gradient theme applied via CSS class on `<html>`. Component variants use `class-variance-authority` + `cn()` from `src/lib/utils.ts`.

### Environment Variables

All Vite-exposed vars use `VITE_` prefix (accessed via `import.meta.env`). Required:
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- `VITE_STRIPE_PUBLIC_KEY`, Stripe price IDs per plan/billing cycle
- `VITE_API_URL` — backend URL for Stripe webhooks
- `VITE_MAINTENANCE_MODE` — set to `"true"` to show maintenance page

Plans are hardcoded in the frontend (Free €0, Basic €5.99/mo, Pro €9.99/mo) with corresponding Stripe Price IDs in `.env`.

### Path Aliases

`@/` maps to `src/`. Use `@/components/ui/button` style imports throughout.
