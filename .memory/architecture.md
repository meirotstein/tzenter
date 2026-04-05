# Tzenter Architecture

## Request flow

### WhatsApp webhook

1. Next exposes `/api/onMessage` via `pages/api/onMessage.ts`, and legacy
   `/onMessage` is preserved via a rewrite in `next.config.mjs`.
2. `src/api/onMessage.ts` reads the raw request body, verifies the request
   signature with `verifyWhatsappMessage`, and then parses JSON.
2. `HandlerFactory` chooses `MessageHandler` for `POST` or
   `VerificationHandler` for `GET`.
3. `MessageHandler` extracts a supported text payload from the webhook body.
4. User context is loaded from KV using key format `user:<phone>`.
5. The handler resolves one of:
   - a hook step based on message text or interactive payload
   - the next step from the stored `currentStepId`
   - the initial menu step if no prior state exists
6. The chosen step sends WhatsApp messages and updates user context.

### Schedule execution

1. Next exposes `/api/onSchedule`, and legacy `/onSchedule` is preserved with a
   rewrite.
2. `src/api/onSchedule.ts` verifies caller IPs with
   `verifyValidScheduleExecuter`.
2. `HandlerFactory` returns `ScheduleHandler`.
3. `ScheduleHandler` finds upcoming schedules within a configurable window.
4. For each matching schedule, it loads schedule context from KV using
   `schedule:<scheduleId>`.
5. `invokeSchedule` fans out WhatsApp actions to all users in the minyan.
6. Schedule status and occurrence counts are persisted for tracking.

## Conversation system

- Conversation registry is in `src/conversation/index.ts`
- Each step provides an `id`, action, and next-step resolution behavior
- Hook words can jump directly into flows, including reset and schedule actions
- User state is stored in Upstash Redis via `Context<UserContext>`
- Unexpected user input is handled separately from unexpected system errors

Useful step clusters:

- onboarding/menu: `initialMenuStep`, `getUserMinyansStep`
- membership management: `registerMinyanStep`, `unregisterMinyanStep`
- selected-Minyan branching: `selectedMinyanStep`, `sendManageMinyanLinkStep`
- scheduling: `initScheduleStep`, `processScheduleStep`
- schedule actions: approve, reject, snooze, attendee updates

### Selected Minyan behavior

- after a user picks a Minyan, `selectedMinyanStep` now computes the next
  future schedule for that Minyan
- schedule lookup lives in `src/schedule/getNextMinyanSchedule.ts`
- text formatting lives in `selectedMinyanStep` itself, not in the schedule
  utility
- displayed variants are:
  - `אין תזמונים עתידיים`
  - `היום בשעה ...`
  - `מחר בשעה ...`
  - `d/M/yyyy בשעה ...`
- admins get:
  - `1. ממשק ניהול`
  - `2. הסר הרשמה`

## Data model

### `User`

- unique phone number
- display name
- many-to-many relation with `Minyan`
- separate many-to-many relation for administered `Minyan` records

### `Minyan`

- unique name
- city
- optional location name
- optional hidden flag
- optional latitude/longitude for relative zmanim-based schedules
- many-to-many users
- many-to-many admins
- one-to-many schedules

### `Schedule`

- belongs to one minyan
- prayer type enum
- fixed time or relative time offset
- enable/disable flag
- optional weekday filtering
- optional date-range filtering
- optional weekly reference day for relative calculations
- optional round-to-nearest-five-minutes behavior
- optional bitmask config field

### `ScheduleOccurrence`

- persisted snapshot of approved/rejected/snoozed counts
- linked by `scheduleId`
- grouped by `invocationId` for a schedule run

## Time calculation logic

`src/schedule/scheduleTimeUtils.ts` is the main source of truth for schedule
timing.

Key behaviors:

- fixed schedules are anchored to the current date in the target timezone
- relative schedules use sunrise/sunset from `kosher-zmanim`
- relative schedule offsets are interpreted as:
  - `BEFORE_*`: subtract `schedule.time`
  - `AFTER_*`: add `schedule.time`
- midnight wrapping is handled explicitly
- date-range and weekday relevance are evaluated before invocation
- upcoming schedules are selected within a start/end time window

`src/schedule/getNextMinyanSchedule.ts` is a narrower helper that:

- scans a single Minyan's enabled schedules over a look-ahead window
- skips irrelevant and holiday-filtered schedules
- returns only the next `schedule + calculatedTime`, or `undefined`

## External integrations

- WhatsApp client wrapper: `src/clients/WhatsappClient.ts`
- KV wrapper over Upstash Redis: `src/clients/KVClient.ts`
- Jewish calendar / zmanim helpers:
  - `@hebcal/core`
  - `kosher-zmanim`
- Google Maps in the admin UI:
  - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
  - location selection/search/marker interaction happens client-side

## Management console

- `/manage-minyan` is a Next.js page rendered by React
- page props are assembled in `src/manage/pageProps.ts`
- first visit with `?t=<token>` creates or reuses a Redis-backed management
  session and sets an HTTP-only cookie
- the token stays usable for 1 hour as long as its linked session still exists
- once the linked session expires, the URL shows the expired page
- management APIs use the same session cookie for auth and actor identity
- current management UI supports:
  - editing Minyan details
  - editing Minyan location with Google Maps
  - creating/updating/deleting schedules
  - viewing registered users read-only

## Testing boundaries

- unit tests validate isolated logic, handlers, repositories, and verifiers
- integration tests call `onMessage` and `onSchedule` directly
- integration tests keep the real conversation/schedule/data stack but replace
  WhatsApp, Redis, request verification, and Hebcal with mocks
- the integration harness lives in `tests/integration/integrationUtils.ts`

## Risks and quirks worth remembering

- Context keys expire after 1 hour, so stale flows self-clear over time
- `verifyWhatsappMessage` reads raw request body for HMAC validation
- the Next wrapper layer under `pages/api` is required even though business
  logic lives in `src/api`
- Vercel must point to the repo root and use the Next.js framework preset
- Production datasource currently relies on schema synchronization
- Relative scheduling depends on minyan coordinates being present
