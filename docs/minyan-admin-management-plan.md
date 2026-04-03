# Minyan Admin Management Plan

## Goal

Add Minyan admins who can manage their own Minyan details and schedules through
a web management console, while keeping the current WhatsApp flow as the entry
point.

## Current system fit

Based on the current codebase:

- WhatsApp conversations are driven by a state machine under `src/conversation`
- durable data is stored in Postgres via TypeORM entities in `src/datasource`
- short-lived state is already stored in Upstash Redis via `Context` / KV
- HTTP endpoints are exposed as Vercel serverless functions under `src/api`

This feature fits the current architecture well if we:

- extend the relational model with Minyan admins
- use Redis for temporary login tokens and web sessions
- add dedicated management API endpoints under `src/api`
- add a small web management UI served by the app

## Desired user flow

### WhatsApp flow

1. User opens `המניינים שלי`
2. Bot shows Minyan list the user is registered to
3. If the user is an admin for a Minyan, that row is suffixed with `[מנהל]`
4. User selects a Minyan by index
5. If the user is not an admin, behavior continues exactly as today
6. If the user is an admin, the bot shows:
   - `1. הסר הרשמה`
   - `2. ממשק ניהול`
7. If the user selects `ממשק ניהול`, the bot sends a URL:
   - `/manage-minyan?t=XXXXXX`

### Web flow

1. Browser opens `/manage-minyan?t=...`
2. Server validates the temporary token from Redis
3. If invalid or expired, show a Hebrew error page
4. If valid, server creates a real authenticated web session
5. User enters the management console for the relevant Minyan
6. All further API calls use the authenticated session

## Recommended auth design

### Recommendation

Use a two-step auth model:

1. temporary login token in Redis
2. server-side session stored in Redis and attached with a secure HTTP-only
   cookie

### Why this is the best fit here

- it is standard web authentication behavior
- it avoids putting long-lived auth in the URL
- it allows immediate expiration and revocation
- it is simpler and safer than using JWTs for this use case
- Redis is already part of the stack and already used for short-lived state

### Why not JWT as the primary session

JWT would work, but it is not the best default here:

- harder to revoke once issued
- easier to accidentally over-scope
- unnecessary for a first-party web console and API on the same app

### Proposed auth sequence

1. WhatsApp flow creates a random token, for example UUID or 32-byte random
   string
2. Save it in Redis with TTL of `1 hour`
3. Redis value should include:
   - `userId`
   - `minyanId`
   - `phone`
   - `issuedAt`
   - optional `sessionId`
4. User opens `/manage-minyan?t=...`
5. On first use, the server validates the token and creates a session record in
   Redis
6. The created `sessionId` is stored back on the token record
7. On later uses of the same URL, the server checks whether the token already
   points to a still-valid session
8. If that linked session is still valid, the server reuses it and sets the
   cookie again
9. If that linked session is no longer valid, the link is treated as expired
10. Session TTL is `1 hour`
11. Server sets a cookie such as `tzenter_manage_session`
12. Cookie settings:
   - `HttpOnly`
   - `Secure`
   - `SameSite=Lax`
   - `Path=/`
13. Browser is redirected to `/manage-minyan` without the token in the URL
14. API requests authenticate using the cookie-backed session

### Session contents

The session should contain at least:

- `userId`
- `minyanIdsAdminOf`
- `activeMinyanId`
- `phone`
- `displayName`

Every management API request must still verify authorization against the target
Minyan rather than trusting the client.

## Data model changes

### Admin relationship

Add a many-to-many relation between `Minyan` and `User` for admins.

Recommended shape:

- `Minyan.users`: existing registered members
- `Minyan.admins`: new admin users
- `User.minyans`: existing registered Minyans
- `User.adminMinyans`: new administered Minyans

This supports:

- multiple admins per Minyan
- one user managing multiple Minyans
- future role expansion if needed

### Invariants

- every admin should also be a registered member of the same Minyan
- removing a user from a Minyan should also remove their admin relation
- management actions must be limited to admins of that specific Minyan

### Entity/repository impact

Likely updates:

- `src/datasource/entities/Minyan.ts`
- `src/datasource/entities/User.ts`
- `src/datasource/minyansRepository.ts`
- `src/datasource/usersRepository.ts`

Repository additions will likely be needed for:

- loading Minyan with `users`, `admins`, and optionally `schedules`
- checking `isUserAdminForMinyan(userId, minyanId)`
- updating editable Minyan fields

## Conversation changes

### `getUserMinyansStep`

Enhance the stored `userMinyans` context payload to include admin status:

- `minyanId`
- `minyanIndex`
- `name`
- `isAdmin`

List rendering change:

- current: `1. שם מניין`
- new for admins: `1. שם מניין [מנהל]`

### `selectedMinyanStep`

Current behavior only distinguishes registered vs not registered.

New behavior:

- if not registered: unchanged
- if registered but not admin: unchanged
- if registered and admin: show admin action menu instead of yes/no prompt

Recommended admin menu text:

`בחרת במניין <name>`

`מה ברצונך לעשות?`

`1. הסר הרשמה`
`2. ממשק ניהול`

### New conversation step(s)

Add dedicated step(s), for example:

- `adminSelectedMinyanStep`
- `sendManageMinyanLinkStep`

Responsibilities:

- detect admin selection
- generate management login token
- send management URL
- finish the WhatsApp flow cleanly

### Backward compatibility

Non-admin users should continue through the exact current unregister flow so the
feature is additive rather than disruptive.

## Temporary token design

### Redis key design

Recommended key:

- `manage-minyan-token:<token>`

Suggested payload:

```json
{
  "userId": 123,
  "minyanId": 45,
  "phone": "9725....",
  "issuedAt": "2026-04-01T10:00:00.000Z",
  "sessionId": "optional-linked-session-id"
}
```

### Expiry and consumption

- token TTL: `1 hour`
- session TTL: `1 hour`
- on first successful use, create a session and store its `sessionId` on the
  token record
- on second or later use, allow the same URL only if the linked session still
  exists
- if the linked session no longer exists, return the expired/invalid page

### Security notes

- token must be cryptographically random
- never log the full token
- avoid embedding PII in the token itself
- rate limit the token exchange endpoint if practical

## Web routes

## Management entry routes

Add routes along these lines:

- `GET /manage-minyan`
  - with `t` query param: exchange token for session
  - without token but with session: load app shell
  - without both: show unauthorized / expired page

### Error pages

Provide Hebrew copy for:

- token expired
- invalid link
- unauthorized access

Suggested tone:

- clear
- short
- action-oriented

Example:

`הקישור פג תוקף.`

`כדי להיכנס שוב לממשק הניהול, יש לפתוח את הממשק מחדש דרך צענטר בוואטסאפ.`

## Management API plan

Expose authenticated management APIs under a dedicated namespace, for example:

- `GET /api/manage/minyan`
- `PATCH /api/manage/minyan`
- `GET /api/manage/minyan/schedules`
- `POST /api/manage/minyan/schedules`
- `PATCH /api/manage/minyan/schedules/:scheduleId`
- `DELETE /api/manage/minyan/schedules/:scheduleId`

### API capabilities

#### Minyan details

Allow editing:

- `name`
- `city`
- `latitude` (optional)
- `longitude` (optional)

The current schema already supports `city`, `latitude`, and `longitude`, so the
feature can use those fields directly without adding a separate textual
`location` column.

#### Schedules

Allow admins to:

- list schedules for their Minyan
- create schedule
- update schedule
- delete schedule
- enable/disable schedule

The API should support existing scheduling features already present in the data
model:

- prayer type
- fixed time
- relative time
- weekdays
- date range
- round-to-nearest-five-minutes
- enabled flag

### Authorization rules

Every endpoint must:

1. resolve session from cookie
2. verify the user is an admin of the target Minyan
3. reject otherwise with `401` or `403`

### Validation rules

Add input validation for:

- required fields
- valid enum values
- time format
- date ordering
- valid weekday arrays
- relative schedule requirements when coordinates are missing

## Management UI plan

## UX goals

The console should be:

- simple
- mobile friendly
- Hebrew-first
- clearly branded as `צענטר`

It should include the app icon when provided.

### Recommended information architecture

#### Header

- Tzenter branding
- Minyan name
- current admin user display name
- logout action

#### Sections

1. Minyan details
   - name
   - city
   - latitude
   - longitude
2. Schedules
   - list existing schedules
   - add new schedule
   - edit existing schedule
   - delete schedule
   - enable / disable

### UI behavior

- optimistic updates are optional; correctness matters more than speed
- destructive actions should require confirmation
- show Hebrew success and error feedback
- handle expired sessions by redirecting to an explanatory page

### Technical shape

Because the current repo does not yet contain an application frontend stack,
there are two viable implementation paths:

1. lightweight server-rendered pages plus vanilla JS
2. add a dedicated frontend app or bundle for the management console

Recommendation:

Start with a lightweight server-rendered or minimal JS console to keep the
scope contained unless there is already a preferred frontend framework decision
outside this repo.

## Suggested backend structure

Possible additions:

- `src/api/manageMinyan.ts` or route-specific handlers under `src/api/manage/*`
- `src/services/manageAuth/*`
- `src/services/manageMinyan/*`
- `src/datasource/*` repository methods for admin-aware loading and updates

Suggested responsibilities:

- auth service: token issue, token exchange, session load, logout
- management service: authorization and business rules
- API layer: request parsing, response formatting, validation mapping

## Rollout phases

### Phase 1: data model and repositories

- add admin relation
- add repository helpers for admin checks and managed Minyan loading

### Phase 2: WhatsApp admin flow

- mark admin Minyans in `המניינים שלי`
- branch selected Minyan flow for admins
- generate and send temporary management links

### Phase 3: auth exchange and session management

- create temporary token exchange route
- create Redis-backed web session
- link tokens to created sessions so the same URL can be reused while the
  session remains valid
- add expired / invalid Hebrew pages

### Phase 4: management APIs

- read Minyan details
- update Minyan details
- CRUD schedules

### Phase 5: management UI

- branded management console
- forms and list views
- error and loading states

### Phase 6: hardening

- authorization audit
- logging / observability
- rate limiting on token exchange
- session expiry behavior

## Testing plan

### Unit tests

- admin relation repository helpers
- token creation and exchange logic
- token reuse behavior while a linked session remains valid
- session validation
- API authorization guards
- schedule payload validation
- route/handler tests for token exchange, expiry, and cookie session behavior

### Integration tests

- WhatsApp flow showing `[מנהל]`
- admin selecting managed Minyan receives two options
- non-admin flow remains unchanged
- token exchange success
- token reuse success while linked session is still valid
- token exchange expiry / reuse failure once the linked session is gone
- admin can CRUD only their own Minyan schedules
- admin cannot manage another Minyan

### Repo-specific testing guidance

Apply the existing testing approach documented in `.memory/testing.md`:

- prefer repository unit tests for entity and relation correctness, including
  admin membership invariants
- use integration tests through the real API entrypoints for WhatsApp
  conversation changes
- keep external boundaries mocked in integration tests, especially
  `WhatsappClient`, `KVClient`, request verifiers, and Hebcal lookups
- treat conversation integration tests as executable specs for the new admin
  path in `המניינים שלי`
- add auth-focused unit or handler tests for token exchange and session
  validation, including token reuse behavior, because the current integration
  harness mocks request verifiers
- keep timer and KV cleanup aligned with the existing `resetAll()` pattern to
  avoid cross-test state pollution

## Open decisions

These should be confirmed before implementation:

1. Should admins always also remain registered members?
   - Recommendation: yes
2. Should a Minyan support multiple admins?
   - Recommendation: yes
3. Session lifetime for the management console?
   - Recommendation: 1 hour, renewable on activity if needed
4. Should the management URL open one Minyan only or allow switching between
   all admin Minyans from one session?
   - Recommendation: open the selected Minyan first, optionally allow switching
     later if the session proves the user manages several

## Recommended implementation choices summary

- Use `Minyan.admins <-> User.adminMinyans` many-to-many relation
- Keep admin as a subset of Minyan members
- Use Redis management tokens with a `1 hour` TTL for the WhatsApp-to-web
  handoff
- On first use, exchange the token for a secure HTTP-only cookie-backed server
  session and persist the linked `sessionId` on the token
- Allow the same URL to be reused while that linked session remains valid
- Add a dedicated management API namespace protected by that session
- Keep editable Minyan details to `name`, `city`, `latitude`, and `longitude`
- Do not expose registered-user retrieval in this feature
- Build a Hebrew-first branded management console for Minyan details and
  schedules

## Deliverables

Implementation should ultimately produce:

- updated entities and repositories
- updated WhatsApp admin flow
- temporary token + session auth flow
- management API endpoints
- Hebrew expired/unauthorized pages
- branded management UI
- automated tests across conversation, auth, and management behavior
