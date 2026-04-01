# Tzenter Project Overview

## What this project is

Tzenter is a WhatsApp bot for organizing attendance around registered minyanim.
It is deployed as Vercel serverless functions and uses:

- Postgres for durable relational data
- Upstash Redis for short-lived conversation and schedule context
- WhatsApp Cloud API for inbound and outbound messaging

## Main user capabilities

- Register and unregister from minyanim
- View minyan options and the user's enrolled minyanim
- Initiate attendance collection for a scheduled prayer
- Approve, reject, snooze, or update attendee counts during a schedule run

## Runtime shape

- `src/api/onMessage.ts`: WhatsApp webhook endpoint
- `src/api/onSchedule.ts`: schedule execution endpoint
- `src/api/onDate.ts`: date-based helper endpoint
- `src/handlers`: request-specific handler implementations
- `src/conversation`: conversation step machine and templates
- `src/schedule`: schedule selection, timing, and invocation logic
- `src/datasource`: TypeORM entities and repositories
- `tests/unit` and `tests/integration`: broad test coverage for logic and flows

## Important architectural idea

The bot is primarily a state machine. Incoming messages are routed through a
stored user context, which tracks the current conversation step. Scheduled
workflows use a separate schedule context keyed by schedule id.

## Notable repo characteristics

- TypeScript project with Jest + ts-jest
- Test environment uses in-memory SQLite instead of Postgres
- Production datasource uses TypeORM `synchronize: true`
- Conversation messages and many tests are written in Hebrew
- Relative schedules are supported using sunrise/sunset calculations
