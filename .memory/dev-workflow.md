# Tzenter Dev Workflow

## Local commands

- `npm run dev`: runs `./dev.sh`, which sets
  `NODE_TLS_REJECT_UNAUTHORIZED=0` and starts `vercel dev`
- `npm test`: full Jest suite
- `npm run unit`: unit tests only
- `npm run integration`: integration tests only
- `npm run typeorm:sync`: TypeORM schema sync via CLI

## Environment variables

### WhatsApp

- `WA_PHONE_NUMBER_ID`
- `WA_APP_SECRET`
- `VERCEL_VERIFY_TOKEN`

### KV / Redis

- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`

### Database

- `DATABASE_HOST`
- `DATABASE_PORT`
- `DATABASE_USER`
- `DATABASE_PASS`
- `DATABASE_NAME`

### Scheduling and access control

- `SCHEDULE_INVOCATION_START_MIN`
- `SCHEDULE_INVOCATION_INTERVAL_MIN`
- `SCHEDULE_ALLOWED_IPS`
- `ADMIN_ALLOWED_IPS`

### Misc

- `DEBUG`
- `NODE_ENV`

## Test setup

- Jest config loads `.env.test`
- Test database is SQLite in-memory
- Many integration tests exercise end-to-end message flows
- Unit tests cover repositories, handlers, scheduling, utils, and verifiers

## Good entry points when making changes

If changing conversation behavior:

- start in `src/conversation/index.ts`
- inspect the relevant step under `src/conversation/steps`
- check `src/conversation/messageTemplates.ts`
- run the closest integration flow test afterward

If changing schedule timing or recurrence:

- start in `src/schedule/getUpcomingSchedule.ts`
- inspect `src/schedule/scheduleTimeUtils.ts`
- verify related tests under `tests/unit/schedules`
- also check any affected integration tests under
  `tests/integration/relativeSchedules`

If changing persistence behavior:

- inspect `src/datasource/entities`
- inspect the matching repository in `src/datasource`
- verify unit tests for that repository

## Practical notes

- The app assumes Asia/Jerusalem or nearby local-time behavior in schedule code
- Hebrew content is normal throughout the conversation layer and tests
- Unsupported inbound WhatsApp message types are ignored rather than errored
- Hook words and payload regexes can bypass normal step progression
