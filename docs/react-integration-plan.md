# React Integration Plan

## Goal

Integrate a modern React-based web application into Tzenter so the Minyan
management console can evolve beyond mostly static HTML while staying aligned
with the current Vercel + TypeScript + serverless architecture.

## Current project constraints

The repository currently has:

- TypeScript backend code under `src/`
- Vercel serverless functions under `src/api`
- no existing frontend framework, build pipeline, or asset pipeline
- Jest-based testing focused on backend/unit/integration behavior
- Redis-backed short-lived auth/session state

That means the React plan should:

- avoid forcing a full rewrite of the backend
- keep the existing auth/session model
- work well on Vercel
- allow gradual migration from current HTML pages

## Recommendation

Use **Next.js with the App Router** as the React integration path.

## Why Next.js is the best fit here

- it is React-native and modern
- it fits Vercel deployment especially well
- it supports both server-rendered and client-rendered UI
- it can coexist with API routes and authenticated pages cleanly
- it gives a path to better routing, layouts, loading states, and forms
- it avoids having to bolt a separate SPA build process onto a backend-only repo

## Why not Vite SPA as the primary recommendation

Vite + React would work, but it creates more coordination overhead here:

- separate frontend dev/build concerns
- client-side routing has to be wired around existing serverless routes
- cookie/session auth and protected entry pages need more manual handling
- deployment and preview flow are less natural for the current Vercel shape

Vite is still a viable fallback if the team wants a very thin frontend-only app,
but it is not the best default for this repo.

## Target architecture

Recommended end state:

- keep domain/data/business logic in backend modules under `src/`
- add a React app using Next.js under `app/` and related frontend folders
- keep management APIs on the server side
- render authenticated management pages through Next.js
- reuse the existing Redis token/session authentication design

## Integration model

### Backend responsibilities

Keep these in backend/shared server code:

- WhatsApp flows
- token issuance from WhatsApp
- token-to-session exchange
- session validation
- authorization checks
- Minyan and schedule persistence
- management API logic

### Frontend responsibilities

Move these into React:

- management console layout
- form UX
- list/detail views
- optimistic or progressive save UX if desired
- client-side validation hints
- Hebrew-first presentation and branding

## Proposed repository structure

Recommended structure:

```text
app/
  manage-minyan/
    page.tsx
    loading.tsx
    error.tsx
  layout.tsx
  globals.css

components/
  manage-minyan/
    ManageMinyanShell.tsx
    MinyanDetailsForm.tsx
    ScheduleList.tsx
    ScheduleEditorDialog.tsx
    SessionExpiredState.tsx

lib/
  manage-minyan/
    api.ts
    types.ts
    validators.ts

src/
  api/
  clients/
  conversation/
  datasource/
  manage/
```

## Recommended migration approach

Do this incrementally rather than replacing everything at once.

### Phase 1: introduce Next.js without removing current backend behavior

Add:

- `next`
- `react`
- `react-dom`
- related TypeScript and ESLint config for Next.js

Keep the current backend modules and APIs intact.

At this phase the goal is only to:

- boot a React app in the same repo
- confirm local dev works
- confirm Vercel can route both the React app and existing serverless handlers

### Phase 2: move the management entry page into React

Replace the current server-generated HTML page at `/manage-minyan` with a
Next.js page.

Recommended page behavior:

1. if `t` exists in query params, perform server-side token exchange
2. if exchange succeeds, set the cookie and redirect to clean URL
3. if session exists, render the React management app
4. if not, render a Hebrew expired/unauthorized page

This preserves the current auth model while upgrading only the UI layer.

### Phase 3: convert management APIs into a cleaner server boundary

You have two valid paths here:

1. keep the existing `/src/api/manage-*` handlers and call them from React
2. move management API handlers into Next.js route handlers

Recommendation:

Move gradually toward Next.js route handlers, but only after the React page is
working.

That gives a smoother migration:

- first reuse existing APIs
- later unify routing and auth handling inside Next.js

### Phase 4: componentize the management UI

Split the page into focused components:

- shell/header
- Minyan details form
- schedules table/list
- create/edit schedule form
- error and empty states

This keeps the first screen simple and makes future changes safer.

### Phase 5: add frontend-specific tooling

Once the React app is stable, add:

- component test setup if desired later
- linting rules for frontend code
- shared UI utilities
- design tokens and CSS architecture

## Routing plan

## Recommended route ownership

Use Next.js for:

- `/manage-minyan`
- future authenticated management routes

Keep existing backend endpoints for:

- WhatsApp webhook endpoints
- schedule execution endpoints
- background/admin-only endpoints

If needed, introduce a `vercel.json` so route ownership is explicit and stable.

## Auth integration plan

Keep the current auth design:

- WhatsApp generates management token
- token exchange creates or reuses a Redis-backed session
- cookie is the browser auth mechanism

In the React version:

- token exchange should happen server-side in the page request or route handler
- session lookup should happen on the server before rendering protected content
- client components should never parse or own the auth cookie directly

## Data-fetching approach

For the management console, prefer:

- server-rendered initial data for the first page load
- client-side fetches for save/update/delete actions

This gives:

- fast authenticated first render
- SEO is not important, but protected page UX is cleaner
- fewer loading flashes
- simpler session enforcement

## State management recommendation

Start simple:

- React local state for forms and dialogs
- a thin fetch wrapper for API calls

Only introduce a heavier client cache library later if the UI grows.

Recommendation:

- begin with plain React state plus small shared hooks
- consider `@tanstack/react-query` later if the console gains more screens or
  cross-page cache needs

## Styling recommendation

Use modern app-level styling rather than inline HTML styles.

Recommended options:

1. CSS Modules
2. Tailwind CSS

Recommendation:

Use **Tailwind CSS**. It has been selected for this repo because it speeds up
iteration for the management console and fits the component-driven React
approach well.

## Form handling recommendation

For this project size, start with:

- controlled or lightly controlled React forms
- `zod` for shared schema validation if desired

You do not need a heavy form abstraction immediately.

Recommended approach:

- HTML form semantics
- thin submit handlers
- server-side validation remains authoritative

## Type-sharing plan

Create shared management types for:

- Minyan details DTO
- Schedule DTO
- create/update payloads
- API error shape

Place them in a shared server-safe location, for example:

- `src/manage/types.ts`
or
- `lib/manage-minyan/types.ts`

The goal is to avoid frontend/backend drift on payload structure.

## Local development plan

Update local workflow so both app and backend run together.

Recommended scripts:

- `npm run dev`: start Next.js dev server
- `npm run test`: keep Jest backend suite
- optional later: `npm run lint`

Because the current repo uses `vercel dev`, decide early whether local dev will
be:

1. Next.js dev-first
2. Vercel dev-first

Recommendation:

Use **Next.js dev-first** for the React app once the migration starts, unless
there is a hard requirement to keep all local development behind `vercel dev`.

## Deployment plan

On Vercel, target a single project that serves:

- Next.js app pages
- Next.js route handlers and/or existing serverless endpoints

Before migration, confirm:

- route precedence
- env var availability in server-rendered React routes
- cookie behavior on preview and production domains

## Testing plan

For now, keep the testing strategy scoped and practical.

### Must-have during integration

- backend unit tests remain as-is
- backend integration tests remain as-is
- add a small number of route/auth tests around `/manage-minyan`
- add component tests only if the React UI becomes complex during migration

### Deferred for later

- broad frontend test suite
- browser E2E suite
- visual regression tooling

This keeps the React integration effort focused on architecture and delivery
rather than test-tool expansion.

## Step-by-step implementation plan

1. Add Next.js and React dependencies and config.
2. Introduce `app/`, `components/`, and `lib/` structure.
3. Create a minimal `app/manage-minyan/page.tsx`.
4. Move token exchange + session validation into server-side route/page logic.
5. Replace current static HTML rendering with React components.
6. Reuse the existing management APIs first.
7. Refine styling and component structure.
8. Optionally migrate management APIs into Next.js route handlers.
9. Clean up deprecated HTML-only helpers once React is fully live.

## Impact on existing files

Likely to change:

- `package.json`
- `tsconfig.json`
- `dev.sh`
- possibly add `next.config.*`
- possibly add `vercel.json`
- `/manage-minyan` page routing and auth entry logic

Likely to add:

- `app/**`
- `components/**`
- `lib/**`
- frontend styles and assets

Likely to remove:

- old static HTML rendering helpers once the React page fully owns the
  management console

## Risks

Main risks to manage:

- route conflicts between Next.js pages and existing serverless endpoints
- duplicated auth logic during migration
- frontend/server type drift
- unclear local dev workflow if both Vercel and Next.js flows coexist
- overbuilding frontend infrastructure before the first real page ships

## Recommended first milestone

The best first milestone is:

Build a Next.js-rendered `/manage-minyan` page that:

- exchanges the token server-side
- reads the cookie-backed session
- loads current Minyan + schedules
- renders a React shell using existing APIs for mutations

That gives the team a real modern UI quickly without forcing an immediate
backend rewrite.
