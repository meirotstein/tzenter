import { DateTime } from "luxon";
import { ScheduleStatus } from "../../src/conversation/types";
import { Prayer, Schedule } from "../../src/datasource/entities/Schedule";
import { ScheduleConfig } from "../../src/datasource/entities/ScheduleConfig";
import { BadInputError, InvalidInputError } from "../../src/errors";
import { WebhookObject } from "../../src/external/whatsapp/types/webhooks";
import { WAMessageType } from "../../src/handlers/types";
import {
  calculatedAttendees,
  errorToHttpStatusCode,
  extractTextFromMessage,
  getDailyEvents,
  isAtLeastMinApart,
  isLastExecution,
  prayerHebName,
  shouldSkipSchedule,
  shouldSkipScheduleToday,
} from "../../src/utils";

describe("utils tests", () => {
  describe("errorToHttpStatusCode", () => {
    it("should return 400 for BadInputError", () => {
      const error = new BadInputError("");
      const statusCode = errorToHttpStatusCode(error);
      expect(statusCode).toBe(400);
    });

    it("should return 422 for InvalidInputError", () => {
      const error = new InvalidInputError("");
      const statusCode = errorToHttpStatusCode(error);
      expect(statusCode).toBe(422);
    });

    it("should return 500 for generic Error", () => {
      const error = new Error();
      const statusCode = errorToHttpStatusCode(error);
      expect(statusCode).toBe(500);
    });

    it("should return 500 for unknown error types", () => {
      class UnknownError extends Error {}
      const error = new UnknownError();
      const statusCode = errorToHttpStatusCode(error);
      expect(statusCode).toBe(500);
    });
  });

  describe("extractTextMessage", () => {
    it("should return undefined for invalid message structure", () => {
      const message: WebhookObject = { entry: [] } as unknown as WebhookObject;
      const result = extractTextFromMessage(message);
      expect(result).toBeUndefined();
    });

    it("should extract text message correctly", () => {
      const message = {
        entry: [
          {
            changes: [
              {
                value: {
                  messages: [
                    {
                      from: "972547488557",
                      id: "message-id",
                      timestamp: "timestamp",
                      text: { body: "message body" },
                      type: "text",
                    },
                  ],
                  contacts: [
                    {
                      wa_id: "phone-number",
                      profile: { name: "contact name" },
                    },
                  ],
                },
              },
            ],
          },
        ],
      } as unknown as WebhookObject;
      const result = extractTextFromMessage(message);
      expect(result).toEqual({
        type: WAMessageType.TEXT,
        id: "message-id",
        recipient: {
          phoneNum: "phone-number",
          name: "contact name",
        },
        timestamp: "timestamp",
        message: "message body",
      });
    });

    it("should extract button message correctly", () => {
      const message = {
        entry: [
          {
            changes: [
              {
                value: {
                  messages: [
                    {
                      from: "972547488557",
                      id: "message-id",
                      timestamp: "timestamp",
                      button: {
                        payload: "button payload",
                        text: "button text",
                      },
                      type: "button",
                    },
                  ],
                  contacts: [
                    {
                      wa_id: "phone-number",
                      profile: { name: "contact name" },
                    },
                  ],
                },
              },
            ],
          },
        ],
      } as unknown as WebhookObject;
      const result = extractTextFromMessage(message);
      expect(result).toEqual({
        type: WAMessageType.TEMPLATE,
        id: "message-id",
        recipient: {
          phoneNum: "phone-number",
          name: "contact name",
        },
        timestamp: "timestamp",
        message: "button text",
        payload: "button payload",
      });
    });

    it("should return undefined if message type is not supported", () => {
      const message = {
        entry: [
          {
            changes: [
              {
                value: {
                  messages: [
                    {
                      from: "972547488557",
                      id: "message-id",
                      timestamp: "timestamp",
                      kookoo: {
                        payload: "kookoo payload",
                        text: "kookoo text",
                      },
                      type: "kookoo",
                    },
                  ],
                  contacts: [
                    {
                      wa_id: "phone-number",
                      profile: { name: "contact name" },
                    },
                  ],
                },
              },
            ],
          },
        ],
      } as unknown as WebhookObject;
      const result = extractTextFromMessage(message);
      expect(result).toBeUndefined();
    });

    it("should return undefined if messages array is missing", () => {
      const message = {
        entry: [
          {
            changes: [
              {
                value: {
                  contacts: [
                    {
                      wa_id: "phone-number",
                      profile: { name: "contact name" },
                    },
                  ],
                },
              },
            ],
          },
        ],
      } as unknown as WebhookObject;
      const result = extractTextFromMessage(message);
      expect(result).toBeUndefined();
    });

    it("should return undefined if contacts array is missing", () => {
      const message = {
        entry: [
          {
            changes: [
              {
                value: {
                  messages: [
                    {
                      id: "message-id",
                      timestamp: "timestamp",
                      text: { body: "message body" },
                    },
                  ],
                },
              },
            ],
          },
        ],
      } as unknown as WebhookObject;
      const result = extractTextFromMessage(message);
      expect(result).toBeUndefined();
    });
  });

  describe("prayerHebName", () => {
    it("should return 'שחרית' for Prayer.Shacharit", () => {
      const result = prayerHebName(Prayer.Shacharit);
      expect(result).toBe("שחרית");
    });

    it("should return 'מנחה' for Prayer.Mincha", () => {
      const result = prayerHebName(Prayer.Mincha);
      expect(result).toBe("מנחה");
    });

    it("should return 'ערבית' for any other prayer", () => {
      const result = prayerHebName(Prayer.Arvit);
      expect(result).toBe("ערבית");
    });
  });

  describe("isAtLeastMinApart", () => {
    it("should return true if the timestamps are at least the given minutes apart", () => {
      const timestamp1 = 1677664800000; // 2023-03-01T10:00:00
      const timestamp2 = 1677666600000; // 2023-03-01T10:30:00
      const result = isAtLeastMinApart(timestamp2, timestamp1, 30);
      expect(result).toBe(true);
    });

    it("should return false if the timestamps are less than the given minutes apart", () => {
      const timestamp1 = 1677664800000; // 2023-03-01T10:00:00
      const timestamp2 = 1677665700000; // 2023-03-01T10:15:00
      const result = isAtLeastMinApart(timestamp1, timestamp2, 30);
      expect(result).toBe(false);
    });

    it("should return true if the timestamps are exactly the given minutes apart", () => {
      const timestamp1 = 1677664800000; // 2023-03-01T10:00:00
      const timestamp2 = 1677666600000; // 2023-03-01T10:30:00
      const result = isAtLeastMinApart(timestamp1, timestamp2, 30);
      expect(result).toBe(true);
    });

    it("should return false if one of the timestamps is invalid", () => {
      const timestamp1 = NaN;
      const timestamp2 = 1677666600000; // 2023-03-01T10:30:00
      const result = isAtLeastMinApart(timestamp1, timestamp2, 30);
      expect(result).toBe(false);
    });
  });

  describe("calculatedAttendees", () => {
    it("should return 0 if there are no approved attendees", () => {
      const scheduleContext = {
        status: ScheduleStatus.processing,
        approved: {},
      };
      const result = calculatedAttendees(scheduleContext);
      expect(result).toBe(0);
    });

    it("should return the correct count of approved attendees", () => {
      const scheduleContext = {
        status: ScheduleStatus.processing,
        approved: { user1: 1, user2: 2, user3: 8 },
      };
      1;
      const result = calculatedAttendees(scheduleContext);
      expect(result).toBe(11);
    });

    it("should return 0 if approved is undefined", () => {
      const scheduleContext = {};
      const result = calculatedAttendees(scheduleContext as any);
      expect(result).toBe(0);
    });
  });

  describe("isLastExecution", () => {
    it("should return true if the current time is within the execution interval", () => {
      const hourStr = "09:00:00";
      const executionIntervalMin = 30;

      jest.spyOn(DateTime, "now").mockReturnValue(
        //@ts-ignore
        DateTime.fromObject(
          { hour: 8, minute: 45, second: 0 },
          { zone: "Asia/Jerusalem" }
        )
      );

      const result = isLastExecution(hourStr, executionIntervalMin);
      expect(result).toBe(true);
    });

    it("should return false if the current time is after the given time", () => {
      const hourStr = "10:00:00";
      const executionIntervalMin = 30;

      jest.spyOn(DateTime, "now").mockReturnValue(
        //@ts-ignore
        DateTime.fromObject(
          { hour: 10, minute: 15, second: 0 },
          { zone: "Asia/Jerusalem" }
        )
      );

      const result = isLastExecution(hourStr, executionIntervalMin);
      expect(result).toBe(false);
    });

    it("should return false if the current time is before the execution interval", () => {
      const hourStr = "10:00:00";
      const executionIntervalMin = 30;

      jest.spyOn(DateTime, "now").mockReturnValue(
        //@ts-ignore
        DateTime.fromObject(
          { hour: 9, minute: 15, second: 0 },
          { zone: "Asia/Jerusalem" }
        )
      );

      const result = isLastExecution(hourStr, executionIntervalMin);
      expect(result).toBe(false);
    });

    it("should handle cases where seconds are not provided in hourStr", () => {
      const hourStr = "10:00";
      const executionIntervalMin = 30;

      jest.spyOn(DateTime, "now").mockReturnValue(
        //@ts-ignore
        DateTime.fromObject(
          { hour: 9, minute: 45, second: 0 },
          { zone: "Asia/Jerusalem" }
        )
      );

      const result = isLastExecution(hourStr, executionIntervalMin);
      expect(result).toBe(true);
    });

    it("should use the default zone if none is provided", () => {
      const hourStr = "10:00:00";
      const executionIntervalMin = 30;

      jest.spyOn(DateTime, "now").mockReturnValue(
        //@ts-ignore
        DateTime.fromObject(
          { hour: 9, minute: 45, second: 0 },
          { zone: "Asia/Jerusalem" }
        )
      );

      const result = isLastExecution(hourStr, executionIntervalMin);
      expect(result).toBe(true);
    });

    it("should return false if hourStr is invalid", () => {
      const hourStr = "invalid-time";
      const executionIntervalMin = 30;

      jest.spyOn(DateTime, "now").mockReturnValue(
        //@ts-ignore
        DateTime.fromObject(
          { hour: 10, minute: 15, second: 0 },
          { zone: "Asia/Jerusalem" }
        )
      );

      const result = isLastExecution(hourStr, executionIntervalMin);
      expect(result).toBe(false);
    });
  });

  describe("shouldSkipScheduleToday", () => {
    it("should return true if there is a major holiday", async () => {
      const date = new Date(2025, 3, 13); // Passover

      const result = await shouldSkipScheduleToday(date);
      expect(result).toBe(true);
    });

    it("should return true if there is a major holiday eve", async () => {
      const date = new Date(2025, 5, 1); // Shavuot eve

      const result = await shouldSkipScheduleToday(date);
      expect(result).toBe(true);
    });

    it("should return false if there is a minor holiday", async () => {
      const date = new Date(2025, 4, 16); // Lag BaOmer

      const result = await shouldSkipScheduleToday(date);
      expect(result).toBe(false);
    });

    it("should return false if there is no holiday in IL but it is holiday on another aboard", async () => {
      const date = new Date(2025, 4, 20); // Isru Hag Pesach
      console.log("date", date);

      const result = await shouldSkipScheduleToday(date);
      expect(result).toBe(false);
    });

    it("should return false if there is a minor holiday eve", async () => {
      const date = new Date(2025, 4, 15); // Lag BaOmer eve

      const result = await shouldSkipScheduleToday(date);
      expect(result).toBe(false);
    });

    it("should return false if there is nothing in this day", async () => {
      const date = new Date(2025, 4, 13); // No holiday

      let result = await shouldSkipScheduleToday(date);
      expect(result).toBe(false);
    });

    it("should return false on rosh hodesh", async () => {
      const date = new Date(2025, 3, 28); // Rosh Hodesh Iyar

      let result = await shouldSkipScheduleToday(date);
      expect(result).toBe(false);
    });

    it("should return false on national holiday", async () => {
      const date = new Date(2025, 4, 1); // Yom Ha'atzmaut

      let result = await shouldSkipScheduleToday(date);
      expect(result).toBe(false);
    });
  });

  describe("shouldSkipSchedule", () => {
    // Helper function to create a mock schedule
    const createMockSchedule = (config?: number): Schedule =>
      ({
        id: 1,
        name: "Test Schedule",
        prayer: Prayer.Shacharit,
        time: "08:00:00",
        enabled: true,
        config,
        minyan: {
          id: 1,
          name: "Test Minyan",
          city: "Test City",
          latitude: 31.7683,
          longitude: 35.2137,
        } as any,
      } as Schedule);

    it("should return false if there is no holiday", async () => {
      const schedule = createMockSchedule();
      const date = new Date(2025, 4, 13); // No holiday

      const result = await shouldSkipSchedule(schedule, date);
      expect(result).toBe(false);
    });

    it("should return true if there is a major holiday and schedule is not configured to run on holidays", async () => {
      const schedule = createMockSchedule(); // No config = default behavior (skip on holidays)
      const date = new Date(2025, 3, 13); // Passover

      const result = await shouldSkipSchedule(schedule, date);
      expect(result).toBe(true);
    });

    it("should return false if there is a major holiday and schedule is configured to run on holidays", async () => {
      const config = ScheduleConfig.setRunOnHoliday(undefined, true);
      const schedule = createMockSchedule(config);
      const date = new Date(2025, 3, 13); // Passover

      const result = await shouldSkipSchedule(schedule, date);
      expect(result).toBe(false);
    });

    it("should return true if there is a holiday eve and schedule is not configured to run on holiday eves", async () => {
      const schedule = createMockSchedule(); // No config = default behavior (skip on holiday eves)
      const date = new Date(2025, 5, 1); // Shavuot eve

      const result = await shouldSkipSchedule(schedule, date);
      expect(result).toBe(true);
    });

    it("should return false if there is a holiday eve and schedule is configured to run on holiday eves", async () => {
      const config = ScheduleConfig.setRunOnHolidayEve(undefined, true);
      const schedule = createMockSchedule(config);
      const date = new Date(2025, 5, 1); // Shavuot eve

      const result = await shouldSkipSchedule(schedule, date);
      expect(result).toBe(false);
    });

    it("should return false if there is a minor holiday regardless of configuration", async () => {
      const schedule = createMockSchedule(); // No config
      const date = new Date(2025, 4, 16); // Lag BaOmer

      const result = await shouldSkipSchedule(schedule, date);
      expect(result).toBe(false);
    });

    it("should return false if there is a minor holiday eve regardless of configuration", async () => {
      const schedule = createMockSchedule(); // No config
      const date = new Date(2025, 4, 15); // Lag BaOmer eve

      const result = await shouldSkipSchedule(schedule, date);
      expect(result).toBe(false);
    });

    it("should return false if schedule is configured to run on both holidays and holiday eves", async () => {
      let config = ScheduleConfig.setRunOnHoliday(undefined, true);
      config = ScheduleConfig.setRunOnHolidayEve(config, true);
      const schedule = createMockSchedule(config);
      const date = new Date(2025, 3, 13); // Passover

      const result = await shouldSkipSchedule(schedule, date);
      expect(result).toBe(false);
    });

    it("should return false if schedule is configured to run on both holidays and holiday eves on holiday eve", async () => {
      let config = ScheduleConfig.setRunOnHoliday(undefined, true);
      config = ScheduleConfig.setRunOnHolidayEve(config, true);
      const schedule = createMockSchedule(config);
      const date = new Date(2025, 5, 1); // Shavuot eve

      const result = await shouldSkipSchedule(schedule, date);
      expect(result).toBe(false);
    });

    it("should return true if schedule is configured to run on holidays but not on holiday eves", async () => {
      const config = ScheduleConfig.setRunOnHoliday(undefined, true);
      const schedule = createMockSchedule(config);
      const date = new Date(2025, 5, 1); // Shavuot eve

      const result = await shouldSkipSchedule(schedule, date);
      expect(result).toBe(true);
    });

    it("should return true if schedule is configured to run on holiday eves but not on holidays", async () => {
      const config = ScheduleConfig.setRunOnHolidayEve(undefined, true);
      const schedule = createMockSchedule(config);
      const date = new Date(2025, 3, 13); // Passover

      const result = await shouldSkipSchedule(schedule, date);
      expect(result).toBe(true);
    });

    it("should return false on rosh hodesh regardless of configuration", async () => {
      const schedule = createMockSchedule(); // No config
      const date = new Date(2025, 3, 28); // Rosh Hodesh Iyar

      const result = await shouldSkipSchedule(schedule, date);
      expect(result).toBe(false);
    });

    it("should return false on national holiday regardless of configuration", async () => {
      const schedule = createMockSchedule(); // No config
      const date = new Date(2025, 4, 1); // Yom Ha'atzmaut

      const result = await shouldSkipSchedule(schedule, date);
      expect(result).toBe(false);
    });

    it("should handle null config the same as undefined config", async () => {
      const schedule = createMockSchedule(null as any); // Null config
      const date = new Date(2025, 3, 13); // Passover

      const result = await shouldSkipSchedule(schedule, date);
      expect(result).toBe(true); // Should skip on holidays by default
    });

    it("should handle config with value 0", async () => {
      const schedule = createMockSchedule(0); // Config = 0
      const date = new Date(2025, 3, 13); // Passover

      const result = await shouldSkipSchedule(schedule, date);
      expect(result).toBe(true); // Should skip on holidays by default
    });
  });

  describe("getDailyEvents", () => {
    it("should return an object with the date and omerCount if omer is present", async () => {
      const date = new Date(2025, 4, 16); // Lag BaOmer

      const result = await getDailyEvents(date);

      expect(result).toEqual({ date, omerCount: 33 });
    });

    it("should return an object with only the date if no omer is present", async () => {
      const date = new Date(2025, 9, 3); // holiday, but not omer

      const result = await getDailyEvents(date);
      expect(result).toEqual({ date });
    });

    it("should return an object with only the date if no events are present", async () => {
      const date = new Date(2025, 6, 12); // No holiday

      const result = await getDailyEvents(date);
      expect(result).toEqual({ date });
    });
  });
});
