# Tzenter Architecture

## Request flow

### WhatsApp webhook

1. `src/api/onMessage.ts` verifies the request signature with
   `verifyWhatsappMessage`.
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

1. `src/api/onSchedule.ts` verifies caller IPs with
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
- scheduling: `initScheduleStep`, `processScheduleStep`
- schedule actions: approve, reject, snooze, attendee updates

## Data model

### `User`

- unique phone number
- display name
- many-to-many relation with `Minyan`

### `Minyan`

- unique name
- city
- optional hidden flag
- optional latitude/longitude for relative zmanim-based schedules
- many-to-many users
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
- midnight wrapping is handled explicitly
- date-range and weekday relevance are evaluated before invocation
- upcoming schedules are selected within a start/end time window

## External integrations

- WhatsApp client wrapper: `src/clients/WhatsappClient.ts`
- KV wrapper over Upstash Redis: `src/clients/KVClient.ts`
- Jewish calendar / zmanim helpers:
  - `@hebcal/core`
  - `kosher-zmanim`

## Risks and quirks worth remembering

- Context keys expire after 1 hour, so stale flows self-clear over time
- `verifyWhatsappMessage` reads raw request body for HMAC validation
- Production datasource currently relies on schema synchronization
- Relative scheduling depends on minyan coordinates being present
- The repository field in `package.json` still points to `vercel/examples.git`
