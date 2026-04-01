# Tzenter Testing

## Test stack

- Jest with `ts-jest`
- `.env.test` is loaded by `jest.config.ts`
- `reflect-metadata` is initialized in `jest.setup.ts`
- Test database is SQLite in-memory via `src/datasource/index.ts` when
  `NODE_ENV === "test"`

## How the two test layers differ

### Unit tests

Unit tests usually isolate one module or one narrow behavior. They often mock
 direct dependencies and assert function calls, returned values, or repository
 behavior.

Common unit-test styles in this repo:

- pure/small logic checks, such as
  `tests/unit/schedules/scheduleTimeUtils.test.ts`
- handler tests with mocked collaborators, such as
  `tests/unit/handlers/ScheduleHandler.test.ts`
- repository tests that still use the in-memory TypeORM datasource, such as
  `tests/unit/datasource/minyansRepository.test.ts`
- client and verifier tests with mocked network/crypto helpers

Important nuance:

- not every unit test is fully mocked
- datasource repository unit tests hit a real in-memory database
- some older unit tests are shallow or incomplete, for example
  `tests/unit/handlers/MessageHandler.test.ts` is currently skipped

### Integration tests

Integration tests exercise real application flows by calling the actual API
 entrypoints:

- `src/api/onMessage.ts`
- `src/api/onSchedule.ts`

They run more of the stack together:

- handlers
- conversation step machine
- TypeORM repositories and entities
- schedule selection and invocation logic

But they replace unstable external boundaries with mocks:

- `WhatsappClient` is mocked so tests can assert sent text/template messages
- `KVClient` is mocked with an in-memory store via `KVClientMock`
- request verifiers are mocked to always allow the request
- Hebcal event lookup is mocked for deterministic holiday behavior

This means integration tests are best understood as application-flow tests, not
 full end-to-end tests against real external services.

## Integration harness

The shared harness is `tests/integration/integrationUtils.ts`.

Key helpers:

- `initMocksAndData(data)`: seeds minyanim, schedules, and users
- `resetAll()`: clears message mocks, database tables, timers, and KV state
- `userMessage(...)`: builds a WhatsApp text webhook and calls `onMessage`
- `userButtonReply(...)`: builds a WhatsApp button webhook and calls `onMessage`
- `scheduleExecution(time)`: time-travels and calls `onSchedule`
- `timeTravelTo(date)`: sets fake system time with Jest fake timers

Assertion helpers:

- `expectTzenterTextMessage`
- `expectTzenterTextMessageSequence`
- `expectTzenterTemplateMessage`
- `expectTzenterTemplateMessageSequence`
- `expectNoNewMessages`

## What integration tests are validating

### Conversation flows

Examples:

- registration and unregistration
- restart hook words
- updating attendance after approval
- multi-minyan user choices when multiple schedules are active

These tests verify the actual step transitions by sending sequential user
 messages and checking the outgoing bot messages.

### Schedule flows

Examples:

- initial reminder fan-out to all registered users
- re-execution throttling using invocation interval logic
- snooze reminders on later executions
- last-minute status updates before schedule time
- "minyan reached" announcements once attendee threshold is met

These tests validate both time-based orchestration and conversation state.

### Relative/holiday scheduling

Examples:

- before/after sunrise and sunset schedules
- weekly reference-day calculations
- round-to-nearest-five-minute behavior
- holiday and holiday-eve config filtering with mocked Hebcal events

These tests are especially important because the schedule logic has several
 interacting dimensions: timezone, date, coordinates, config flags, and timing
 windows.

## Data and state behavior under test

- relational data is real and persisted through TypeORM repositories
- conversation and schedule context are stored in `KVClientMock`
- context survives across multiple actions within the same test file until
  `resetAll()` or explicit deletion
- some tests manually clear schedule contexts between cases to avoid polluted
  state, such as `tests/integration/scheduleByHolidaysFlow.test.ts`

## Good testing guidance for future changes

If changing step transitions or bot copy:

- start with the nearest integration flow test
- treat the existing flow tests as executable conversation specs

If changing scheduling logic:

- add or update unit tests around the calculation helper first
- then confirm behavior through an integration flow if user-visible timing or
  notifications change

If changing a repository or entity relation:

- use repository unit tests for data correctness
- add an integration test only if the data change affects a real user flow

## Common pitfalls

- integration assertions often depend on call order; use the order-insensitive
  template matcher only when fan-out ordering is not stable
- fake timers are used in schedule tests, so cleanup with `resetAll()` matters
- mocked verifiers mean integration tests do not validate real auth/signature
  behavior; that coverage lives in unit tests
- mocked WhatsApp and KV clients mean these tests will not catch provider API
  contract drift
