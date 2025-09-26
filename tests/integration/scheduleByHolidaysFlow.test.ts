import templates from "../../src/conversation/waTemplates";
import { Prayer, WeekDay } from "../../src/datasource/entities/Schedule";
import { ScheduleConfig, ScheduleConfigFlag } from "../../src/datasource/entities/ScheduleConfig";
import {
  expectNoNewMessages,
  expectTzenterTemplateMessageSequence,
  getCurrentTemplateMessageCallsCount,
  initMocksAndData,
  resetAll,
  scheduleExecution,
  timeTravelTo,
} from "./integrationUtils";
import { getJewishEventsOnDateWrapper } from "../../src/external/hebcal/getJewishEventsOnDateWrapper";
import { flags } from "../../src/external/hebcal/flags";
import { WhatsappClient } from "../../src/clients/WhatsappClient";

const user1 = {
  phoneNum: 972547488557,
  name: "מוישה זוכמיר",
};

describe("schedule by holidays flow", () => {
  beforeAll(async () => {
    await initMocksAndData({
      minyans: [
        {
          name: "איצקוביץ",
          city: "תל אביב",
          latitude: 31.9,
          longitude: 35.2,
        },
      ],
      users: [
        {
          phoneNum: user1.phoneNum,
          name: user1.name,
          minyanNames: ["איצקוביץ"],
        },
      ],
      schedules: [
        // Default schedule - no holiday configuration (should skip on holidays)
        {
          name: "תפילת שחרית - רגיל",
          prayer: Prayer.Shacharit,
          time: "08:00",
          minyanName: "איצקוביץ",
          weekDays: [WeekDay.Monday, WeekDay.Tuesday, WeekDay.Wednesday, WeekDay.Thursday, WeekDay.Friday],
          startAt: new Date("2025-01-01"),
          endAt: new Date("2025-12-31"),
        },
        // Schedule configured to run on holidays only
        {
          name: "תפילת שחרית - חגים",
          prayer: Prayer.Shacharit,
          time: "08:00",
          minyanName: "איצקוביץ",
          weekDays: [WeekDay.Monday, WeekDay.Tuesday, WeekDay.Wednesday, WeekDay.Thursday, WeekDay.Friday],
          startAt: new Date("2025-01-01"),
          endAt: new Date("2025-12-31"),
          config: ScheduleConfig.setRunOnHoliday(undefined, true),
        },
        // Schedule configured to run on holiday eves only
        {
          name: "תפילת שחרית - ערבי חגים",
          prayer: Prayer.Shacharit,
          time: "08:00",
          minyanName: "איצקוביץ",
          weekDays: [WeekDay.Monday, WeekDay.Tuesday, WeekDay.Wednesday, WeekDay.Thursday, WeekDay.Friday],
          startAt: new Date("2025-01-01"),
          endAt: new Date("2025-12-31"),
          config: ScheduleConfig.setRunOnHolidayEve(undefined, true),
        },
        // Schedule configured to run on both holidays and holiday eves
        {
          name: "תפילת שחרית - חגים וערבי חגים",
          prayer: Prayer.Shacharit,
          time: "08:00",
          minyanName: "איצקוביץ",
          weekDays: [WeekDay.Monday, WeekDay.Tuesday, WeekDay.Wednesday, WeekDay.Thursday, WeekDay.Friday],
          startAt: new Date("2025-01-01"),
          endAt: new Date("2025-12-31"),
          config: ScheduleConfig.setRunOnHolidayEve(
            ScheduleConfig.setRunOnHoliday(undefined, true),
            true
          ),
        },
        // Schedule for Saturday (to test Shabbat vs holiday logic)
        {
          name: "תפילת שחרית - שבת",
          prayer: Prayer.Shacharit,
          time: "09:00",
          minyanName: "איצקוביץ",
          weekDays: [WeekDay.Saturday],
          startAt: new Date("2025-01-01"),
          endAt: new Date("2025-12-31"),
          config: ScheduleConfig.setRunOnHoliday(undefined, true),
        },
      ],
    });
  });

  afterAll(async () => {
    await resetAll();
  });

  beforeEach(async () => {
    // Clear schedule contexts between tests to ensure each test uses initScheduleStep
    const { Context, ContextType } = await import("../../src/conversation/context");
    const scheduleContexts = await Context.getAllContexts(ContextType.Schedule);
    for (const context of scheduleContexts) {
      await context.delete();
    }
  });


  describe("Holiday configuration filtering", () => {
    it("should trigger all schedules on regular day", async () => {
      // Monday, January 13, 2025 at 8:00 AM (regular day)
      timeTravelTo(new Date("2025-01-13T08:00:00"));
      await scheduleExecution("08:00");

      // Should trigger all weekday schedules (4 schedules)
      const calls = getCurrentTemplateMessageCallsCount();
      expect(calls).toBe(4);
    });

    it("should filter schedules on holiday based on configuration", async () => {
      // Mock holiday events for this test
      const mockHolidayEvents = [{
        mask: flags.CHAG,
        desc: 'Passover',
        date: '2025-04-14T00:00:00.000Z'
      }];

      (getJewishEventsOnDateWrapper as jest.Mock).mockResolvedValue(mockHolidayEvents);
      
      // Monday, April 14, 2025 at 8:00 AM (Passover - major holiday)
      timeTravelTo(new Date("2025-04-14T08:00:00"));
      await scheduleExecution("08:00");


      // Should only trigger schedules configured to run on holidays
      // Based on the test setup, only 2 schedules should run (holiday and both-holidays)
      // Use expectNoNewMessages to check that exactly 2 new template messages were sent
      expectNoNewMessages(undefined, 6); // 4 from first test + 2 from this test
    });

    it("should filter schedules on holiday eve based on configuration", async () => {
      // Mock holiday eve events for this test
      const mockHolidayEveEvents = [{
        mask: flags.EREV,
        desc: 'Erev Shavuot',
        date: '2025-06-01T00:00:00.000Z'
      }];

      (getJewishEventsOnDateWrapper as jest.Mock).mockResolvedValue(mockHolidayEveEvents);
      
      // Sunday, June 1, 2025 at 8:00 AM (Shavuot eve)
      timeTravelTo(new Date("2025-06-01T08:00:00"));
      await scheduleExecution("08:00");

      // Should only trigger schedules configured to run on holiday eves
      // Based on the test setup, only 2 schedules should run (holiday-eve and both-holidays)
      expectNoNewMessages(undefined, 8); // 4 from first test + 2 from holiday test + 2 from this test
    });

    it("should run all schedules on minor holidays", async () => {
      // Mock minor holiday events for this test
      const mockMinorHolidayEvents = [{
        mask: flags.MINOR_HOLIDAY,
        desc: 'Lag BaOmer',
        date: '2025-05-14T00:00:00.000Z'
      }];

      (getJewishEventsOnDateWrapper as jest.Mock).mockResolvedValue(mockMinorHolidayEvents);
      
      // Wednesday, May 14, 2025 at 8:00 AM (Lag BaOmer - minor holiday)
      timeTravelTo(new Date("2025-05-14T08:00:00"));
      await scheduleExecution("08:00");

      // Minor holidays should not affect scheduling - all schedules should run
      expectNoNewMessages(undefined, 12); // 4 + 2 + 2 + 4 = 12 total calls
    });
  });

});
