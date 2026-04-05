# Tzenter Project Overview

## What this project is

Tzenter is a WhatsApp bot for organizing attendance around registered minyanim.
It is deployed on Vercel and now combines:

- Next.js pages and API routes for web/admin UI and public endpoints
- the existing TypeScript backend logic under `src/`

It uses:

- Postgres for durable relational data
- Upstash Redis for short-lived conversation and schedule context
- WhatsApp Cloud API for inbound and outbound messaging

## Main user capabilities

- Register and unregister from minyanim
- View minyan options and the user's enrolled minyanim
- See the next scheduled prayer when selecting a minyan
- Initiate attendance collection for a scheduled prayer
- Approve, reject, snooze, or update attendee counts during a schedule run
- Administer owned minyanim through a management console

## Runtime shape

- `pages/manage-minyan.tsx`: admin management UI entrypoint
- `pages/api/*`: Next API route wrappers and management endpoints
- `src/api/onMessage.ts`: WhatsApp webhook backend handler
- `src/api/onSchedule.ts`: schedule execution backend handler
- `src/api/onDate.ts`: date-based helper backend handler
- `src/api/manage-minyan-*.ts`: management API handlers
- `src/handlers`: request-specific handler implementations
- `src/conversation`: conversation step machine and templates
- `src/schedule`: schedule selection, timing, and invocation logic
- `src/manage`: session auth, validation, and page-props shaping for the web UI
- `src/datasource`: TypeORM entities and repositories
- `tests/unit` and `tests/integration`: broad test coverage for logic and flows

## Important architectural idea

The bot is primarily a state machine. Incoming messages are routed through a
stored user context, which tracks the current conversation step. Scheduled
workflows use a separate schedule context keyed by schedule id.

## Notable repo characteristics

- TypeScript project with Jest + ts-jest
- Next.js app with React UI for Minyan management
- Tailwind-based management UI
- Test environment uses in-memory SQLite instead of Postgres
- Production datasource uses TypeORM `synchronize: true`
- Conversation messages and many tests are written in Hebrew
- Relative schedules are supported using sunrise/sunset calculations
- Google Maps is used in the admin UI for mobile-first Minyan location editing
