import templates from "../../src/conversation/waTemplates";
import { Prayer, WeekDay } from "../../src/datasource/entities/Schedule";
import {
  expectNoNewMessages,
  expectTzenterTemplateMessageSequence,
  getCurrentTemplateMessageCallsCount,
  initMocksAndData,
  resetAll,
  scheduleExecution,
  timeTravelTo,
} from "./integrationUtils";

const user1 = {
  phoneNum: 972547488557,
  name: "מוישה זוכמיר",
};

describe("schedule by date range and weekday flow", () => {
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
        {
          name: "תפילת שחרית - ימי חול",
          prayer: Prayer.Shacharit,
          time: "08:00",
          minyanName: "איצקוביץ",
          weekDays: [
            WeekDay.Monday,
            WeekDay.Tuesday,
            WeekDay.Wednesday,
            WeekDay.Thursday,
            WeekDay.Friday,
          ],
          startAt: new Date("2023-01-01"),
          endAt: new Date("2023-01-31"),
        },
        {
          name: "תפילת שחרית - שבת",
          prayer: Prayer.Shacharit,
          time: "09:00",
          minyanName: "איצקוביץ",
          weekDays: [WeekDay.Saturday],
          startAt: new Date("2023-01-01"),
          endAt: new Date("2023-01-31"),
        },
        {
          name: "תפילת מנחה - ימי חול",
          prayer: Prayer.Mincha,
          time: "16:00",
          minyanName: "איצקוביץ",
          weekDays: [
            WeekDay.Monday,
            WeekDay.Tuesday,
            WeekDay.Wednesday,
            WeekDay.Thursday,
            WeekDay.Friday,
          ],
          startAt: new Date("2023-02-01"),
          endAt: new Date("2023-02-28"),
        },
        {
          name: "תפילת מנחה - שבת",
          prayer: Prayer.Mincha,
          time: "17:00",
          minyanName: "איצקוביץ",
          weekDays: [WeekDay.Saturday],
          startAt: new Date("2023-02-01"),
          endAt: new Date("2023-02-28"),
        },
        {
          name: "תפילת ערבית - ימי ראשון בלבד",
          prayer: Prayer.Arvit,
          time: "20:00",
          minyanName: "איצקוביץ",
          weekDays: [WeekDay.Sunday],
          startAt: new Date("2023-01-01"),
          endAt: new Date("2023-01-31"),
        },
      ],
    });
  });

  afterAll(async () => {
    await resetAll();
  });

  it("should trigger weekday-specific schedules on Monday in January", async () => {
    // Monday, January 16, 2023 at 8:00 AM
    timeTravelTo(new Date("2023-01-16T08:00:00"));
    await scheduleExecution("08:00");

    // Should trigger weekday-specific Shacharit (Monday is a weekday)
    expectTzenterTemplateMessageSequence([
      {
        phoneNum: user1.phoneNum,
        template: templates.minyan_appointment_reminder,
        params: {
          "1": "איצקוביץ",
          "2": "שחרית",
          "3": "08:00",
          "4": "-",
        },
        replyIds: ["approve:1", "reject:1", "snooze:1"],
      },
    ]);
  });

  it("should trigger weekday-specific schedules on Saturday in January", async () => {
    // Saturday, January 21, 2023 at 9:00 AM
    timeTravelTo(new Date("2023-01-21T09:00:00"));
    await scheduleExecution("09:00");

    // Should trigger Saturday-specific Shacharit
    expectTzenterTemplateMessageSequence([
      {
        phoneNum: user1.phoneNum,
        template: templates.minyan_appointment_reminder,
        params: {
          "1": "איצקוביץ",
          "2": "שחרית",
          "3": "09:00",
          "4": "-",
        },
        replyIds: ["approve:2", "reject:2", "snooze:2"],
      },
    ]);
  });

  it("should not trigger weekday-specific schedules on Sunday in January", async () => {
    // Sunday, January 15, 2023 at 8:00 AM
    timeTravelTo(new Date("2023-01-15T08:00:00"));
    await scheduleExecution("08:00");

    // Should not trigger any weekday-specific Shacharit (Sunday is not in weekday list)
    expectNoNewMessages();
  });

  it("should trigger date range-specific schedules in February", async () => {
    // Monday, February 6, 2023 at 4:00 PM
    timeTravelTo(new Date("2023-02-06T16:00:00"));
    await scheduleExecution("16:00");

    // Should trigger weekday-specific Mincha (Monday is a weekday and within February date range)
    expectTzenterTemplateMessageSequence([
      {
        phoneNum: user1.phoneNum,
        template: templates.minyan_appointment_reminder,
        params: {
          "1": "איצקוביץ",
          "2": "מנחה",
          "3": "16:00",
          "4": "-",
        },
        replyIds: ["approve:3", "reject:3", "snooze:3"],
      },
    ]);
  });

  it("should not trigger date range-specific schedules outside the range", async () => {
    // Monday, March 6, 2023 at 4:00 PM (outside February range)
    timeTravelTo(new Date("2023-03-06T16:00:00"));
    await scheduleExecution("16:00");

    // Should not trigger any Mincha (outside February date range)
    expectNoNewMessages();
  });

  it("should trigger schedules with both weekday and date range constraints", async () => {
    // Sunday, January 15, 2023 at 8:00 PM
    timeTravelTo(new Date("2023-01-15T20:00:00"));
    await scheduleExecution("20:00");

    // Should trigger Sunday-specific Arvit (Sunday is in weekday list and within January date range)
    expectTzenterTemplateMessageSequence([
      {
        phoneNum: user1.phoneNum,
        template: templates.minyan_appointment_reminder,
        params: {
          "1": "איצקוביץ",
          "2": "ערבית",
          "3": "20:00",
          "4": "-",
        },
        replyIds: ["approve:5", "reject:5", "snooze:5"],
      },
    ]);
  });

  it("should trigger schedules with only date range constraints", async () => {
    // Tuesday, January 17, 2023 at 7:00 PM (within date range)
    timeTravelTo(new Date("2023-01-17T19:00:00"));
    await scheduleExecution("19:00");

    // Should not trigger any schedule (no matching schedule for this time)
    expectNoNewMessages();
  });

  it("should not trigger schedules outside date range", async () => {
    // Tuesday, January 10, 2023 at 7:00 PM (before date range)
    timeTravelTo(new Date("2023-01-10T19:00:00"));
    await scheduleExecution("19:00");

    // Should not trigger daily Arvit (before date range)
    expectNoNewMessages();
  });

  it("should not trigger schedules after date range", async () => {
    // Tuesday, January 25, 2023 at 7:00 PM (after date range)
    timeTravelTo(new Date("2023-01-25T19:00:00"));
    await scheduleExecution("19:00");

    // Should not trigger daily Arvit (after date range)
    expectNoNewMessages();
  });

  it("should handle multiple constraints correctly", async () => {
    // Test that schedules with different constraints don't interfere with each other

    // Monday, January 16, 2023 at 8:00 AM - should trigger weekday Shacharit
    timeTravelTo(new Date("2023-01-16T08:00:00"));
    await scheduleExecution("08:00");

    expectTzenterTemplateMessageSequence([
      {
        phoneNum: user1.phoneNum,
        template: templates.minyan_appointment_reminder,
        params: {
          "1": "איצקוביץ",
          "2": "ערבית",
          "3": "20:00",
          "4": "-",
        },
        replyIds: ["approve:5", "reject:5", "snooze:5"],
      },
    ]);

    // Monday, January 16, 2023 at 8:00 PM - should trigger Sunday-specific Arvit (but it's Monday, so no)
    timeTravelTo(new Date("2023-01-16T20:00:00"));
    await scheduleExecution("20:00");

    // Should not trigger Sunday-specific Arvit on Monday
    expectNoNewMessages();

    // Sunday, January 15, 2023 at 8:00 PM - should trigger Sunday-specific Arvit
    timeTravelTo(new Date("2023-01-15T20:00:00"));
    await scheduleExecution("20:00");

    expectTzenterTemplateMessageSequence([
      {
        phoneNum: user1.phoneNum,
        template: templates.minyan_appointment_reminder,
        params: {
          "1": "איצקוביץ",
          "2": "ערבית",
          "3": "20:00",
          "4": "-",
        },
        replyIds: ["approve:5", "reject:5", "snooze:5"],
      },
    ]);
  });

  it("should handle edge cases with date boundaries", async () => {
    // Test start date boundary - January 1, 2023 at 8:00 AM
    timeTravelTo(new Date("2023-01-01T08:00:00"));
    await scheduleExecution("08:00");

    // Should trigger weekday Shacharit (on start date)
    expectTzenterTemplateMessageSequence([
      {
        phoneNum: user1.phoneNum,
        template: templates.minyan_appointment_reminder,
        params: {
          "1": "איצקוביץ",
          "2": "ערבית",
          "3": "20:00",
          "4": "-",
        },
        replyIds: ["approve:5", "reject:5", "snooze:5"],
      },
    ]);

    // Test end date boundary - January 31, 2023 at 8:00 AM
    timeTravelTo(new Date("2023-01-31T08:00:00"));
    await scheduleExecution("08:00");

    // Should trigger weekday Shacharit (on end date)
    expectTzenterTemplateMessageSequence([
      {
        phoneNum: user1.phoneNum,
        template: templates.minyan_appointment_reminder,
        params: {
          "1": "איצקוביץ",
          "2": "ערבית",
          "3": "20:00",
          "4": "-",
        },
        replyIds: ["approve:5", "reject:5", "snooze:5"],
      },
    ]);

    // Test after end date - February 1, 2023 at 8:00 AM
    timeTravelTo(new Date("2023-02-01T08:00:00"));
    await scheduleExecution("08:00");

    // Should not trigger weekday Shacharit (after end date)
    expectNoNewMessages();
  });
});
