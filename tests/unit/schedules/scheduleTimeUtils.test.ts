import * as KosherZmanim from "kosher-zmanim";
import { DateTime } from "luxon";
import { Minyan } from "../../../src/datasource/entities/Minyan";
import {
  Prayer,
  RelativeTime,
  Schedule,
  WeekDay,
} from "../../../src/datasource/entities/Schedule";
import {
  calculateDayTimes,
  calculateScheduleTime,
  hasScheduleTimePassed,
  isScheduleActiveOnDate,
  isScheduleActiveOnWeekday,
  isScheduleInTimeRange,
  isScheduleRelevantForDate,
  roundToFiveMinutes,
} from "../../../src/schedule/scheduleTimeUtils";

// Mock KosherZmanim module
jest.mock("kosher-zmanim", () => ({
  getZmanimJson: jest.fn(),
}));

describe("scheduleTimeUtils", () => {
  const timezone = "Asia/Jerusalem";

  // Mock minyan for testing
  const mockMinyan: Minyan = {
    id: 1,
    name: "Test Minyan",
    city: "Test City",
    schedules: [],
  };

  describe("roundToFiveMinutes", () => {
    it("should round minutes to the nearest 5", () => {
      const testCases = [
        { input: "2023-01-01T10:02:30", expected: "2023-01-01T10:00:00" },
        { input: "2023-01-01T10:03:30", expected: "2023-01-01T10:05:00" },
        { input: "2023-01-01T10:07:30", expected: "2023-01-01T10:05:00" },
        { input: "2023-01-01T10:12:30", expected: "2023-01-01T10:10:00" },
        { input: "2023-01-01T10:57:30", expected: "2023-01-01T10:55:00" },
        { input: "2023-01-01T10:58:30", expected: "2023-01-01T11:00:00" },
      ];

      for (const { input, expected } of testCases) {
        const dt = DateTime.fromISO(input);
        const result = roundToFiveMinutes(dt);
        expect(result.toISO()).toBe(DateTime.fromISO(expected).toISO());
      }
    });
  });

  describe("calculateScheduleTime", () => {
    it("should calculate time for regular schedules", () => {
      const schedule = {
        id: 1,
        name: "Morning Prayer",
        prayer: Prayer.Shacharit,
        time: "08:00:00",
        enabled: true,
        minyan: mockMinyan,
      } as Schedule;

      const referenceDate = new Date("2023-01-01T06:00:00");
      const result = calculateScheduleTime(
        schedule,
        timezone,
        undefined,
        referenceDate
      );

      expect(result.hour).toBe(8);
      expect(result.minute).toBe(0);
      expect(result.day).toBe(1); // Same day
    });

    it("should handle midnight wrapping for regular schedules", () => {
      const schedule = {
        id: 1,
        name: "Morning Prayer",
        prayer: Prayer.Shacharit,
        time: "08:00:00",
        enabled: true,
        minyan: mockMinyan,
      } as Schedule;

      const referenceDate = new Date("2023-01-01T10:00:00");
      const result = calculateScheduleTime(
        schedule,
        timezone,
        undefined,
        referenceDate
      );

      expect(result.hour).toBe(8);
      expect(result.minute).toBe(0);
      expect(result.day).toBe(2); // Next day
    });

    it("should calculate time for relative schedules based on sunrise", () => {
      const schedule = {
        id: 1,
        name: "After Sunrise Prayer",
        prayer: Prayer.Shacharit,
        time: "0:30:00",
        enabled: true,
        relative: RelativeTime.AFTER_SUNRISE,
        minyan: mockMinyan,
      } as Schedule;

      const dayTimes = {
        sunrise: DateTime.fromISO("2023-01-01T06:00:00"),
        sunset: DateTime.fromISO("2023-01-01T17:00:00"),
      };

      const referenceDate = new Date("2023-01-01T04:00:00");
      const result = calculateScheduleTime(
        schedule,
        timezone,
        dayTimes,
        referenceDate
      );

      expect(result.hour).toBe(6);
      expect(result.minute).toBe(30);
      expect(result.day).toBe(1);
    });

    it("should calculate time for relative schedules based on sunset", () => {
      const schedule = {
        id: 1,
        name: "Before Sunset Prayer",
        prayer: Prayer.Mincha,
        time: "1:00:00",
        enabled: true,
        relative: RelativeTime.BEFORE_SUNSET,
        minyan: mockMinyan,
      } as Schedule;

      const dayTimes = {
        sunrise: DateTime.fromISO("2023-01-01T06:00:00"),
        sunset: DateTime.fromISO("2023-01-01T17:00:00"),
      };

      const referenceDate = new Date("2023-01-01T04:00:00");
      const result = calculateScheduleTime(
        schedule,
        timezone,
        dayTimes,
        referenceDate
      );

      expect(result.hour).toBe(16);
      expect(result.minute).toBe(0);
      expect(result.day).toBe(1);
    });

    it("should handle weekly schedules", () => {
      // January 1st 2023 is a Sunday (weekday 7)
      const schedule = {
        id: 1,
        name: "Tuesday Sunrise Prayer",
        prayer: Prayer.Shacharit,
        time: "0:30:00",
        enabled: true,
        relative: RelativeTime.AFTER_SUNRISE,
        weeklyDetermineByDay: WeekDay.Tuesday, // This is used to determine which day's sunrise/sunset to use
        minyan: mockMinyan,
      } as Schedule;

      const dayTimes = {
        sunrise: DateTime.fromISO("2023-01-01T06:00:00"),
        sunset: DateTime.fromISO("2023-01-01T17:00:00"),
      };

      const referenceDate = new Date("2023-01-01T04:00:00"); // Sunday
      const result = calculateScheduleTime(
        schedule,
        timezone,
        dayTimes,
        referenceDate
      );

      // The schedule should use the sunrise time from dayTimes
      // and add 30 minutes (from time: "0:30:00")
      expect(result.weekday).toBe(7); // Sunday (same as reference date)
      expect(result.hour).toBe(6);
      expect(result.minute).toBe(30);
    });

    it("should round to nearest 5 minutes when specified", () => {
      const schedule = {
        id: 1,
        name: "Rounded After Sunrise",
        prayer: Prayer.Shacharit,
        time: "0:33:00",
        enabled: true,
        relative: RelativeTime.AFTER_SUNRISE,
        roundToNearestFiveMinutes: true,
        minyan: mockMinyan,
      } as Schedule;

      const dayTimes = {
        sunrise: DateTime.fromISO("2023-01-01T06:00:00"),
        sunset: DateTime.fromISO("2023-01-01T17:00:00"),
      };

      const referenceDate = new Date("2023-01-01T04:00:00");
      const result = calculateScheduleTime(
        schedule,
        timezone,
        dayTimes,
        referenceDate
      );

      expect(result.hour).toBe(6);
      expect(result.minute).toBe(35); // Rounded from 33 to 35
    });
  });

  describe("isScheduleInTimeRange", () => {
    it("should return true for schedules within the time range (same day)", () => {
      const calculatedTime = DateTime.fromISO("2023-01-01T10:00:00");
      const startTime = DateTime.fromISO("2023-01-01T09:00:00");
      const endTime = DateTime.fromISO("2023-01-01T11:00:00");

      const result = isScheduleInTimeRange(calculatedTime, startTime, endTime);

      expect(result).toBe(true);
    });

    it("should return false for schedules outside the time range (same day)", () => {
      const calculatedTime = DateTime.fromISO("2023-01-01T12:00:00");
      const startTime = DateTime.fromISO("2023-01-01T09:00:00");
      const endTime = DateTime.fromISO("2023-01-01T11:00:00");

      const result = isScheduleInTimeRange(calculatedTime, startTime, endTime);

      expect(result).toBe(false);
    });

    it("should handle schedules that wrap around midnight (before midnight)", () => {
      const calculatedTime = DateTime.fromISO("2023-01-01T23:30:00");
      const startTime = DateTime.fromISO("2023-01-01T23:00:00");
      const endTime = DateTime.fromISO("2023-01-02T01:00:00");

      const result = isScheduleInTimeRange(calculatedTime, startTime, endTime);

      expect(result).toBe(true);
    });

    it("should handle schedules that wrap around midnight (after midnight)", () => {
      const calculatedTime = DateTime.fromISO("2023-01-02T00:30:00");
      const startTime = DateTime.fromISO("2023-01-01T23:00:00");
      const endTime = DateTime.fromISO("2023-01-02T01:00:00");

      const result = isScheduleInTimeRange(calculatedTime, startTime, endTime);

      expect(result).toBe(true);
    });

    it("should return false for schedules outside the time range (across midnight)", () => {
      const calculatedTime = DateTime.fromISO("2023-01-02T02:00:00");
      const startTime = DateTime.fromISO("2023-01-01T23:00:00");
      const endTime = DateTime.fromISO("2023-01-02T01:00:00");

      const result = isScheduleInTimeRange(calculatedTime, startTime, endTime);

      expect(result).toBe(false);
    });
  });

  describe("calculateDayTimes", () => {
    beforeEach(() => {
      // Reset the mock before each test
      jest.clearAllMocks();
    });

    it("should calculate sunrise and sunset times for a specific date and location", () => {
      // Mock the KosherZmanim response
      const mockZmanimResponse = {
        BasicZmanim: {
          Sunrise: "2023-06-21T05:30:00+03:00",
          Sunset: "2023-06-21T19:45:00+03:00",
        },
      };

      // Set up the mock to return our predefined response
      (KosherZmanim.getZmanimJson as jest.Mock).mockReturnValue(
        mockZmanimResponse
      );

      const date = new Date("2023-06-21");
      const latitude = 31.7683; // Jerusalem latitude
      const longitude = 35.2137; // Jerusalem longitude
      const timezone = "Asia/Jerusalem";

      const result = calculateDayTimes(date, latitude, longitude, timezone);

      // Verify KosherZmanim was called with the correct parameters
      expect(KosherZmanim.getZmanimJson).toHaveBeenCalledWith({
        date,
        latitude,
        longitude,
        elevation: 0,
        timeZoneId: timezone,
      });

      // Verify the result structure
      expect(result).toHaveProperty("sunrise");
      expect(result).toHaveProperty("sunset");

      // Verify that the returned values are DateTime objects
      expect(result.sunrise).toBeInstanceOf(DateTime);
      expect(result.sunset).toBeInstanceOf(DateTime);

      // Verify the timezone is set correctly
      expect(result.sunrise.zoneName).toBe(timezone);
      expect(result.sunset.zoneName).toBe(timezone);

      // Verify the exact times match our mock data
      expect(result.sunrise.hour).toBe(5);
      expect(result.sunrise.minute).toBe(30);
      expect(result.sunset.hour).toBe(19);
      expect(result.sunset.minute).toBe(45);
    });

    it("should use the provided timezone", () => {
      // Mock the KosherZmanim response
      const mockZmanimResponse = {
        BasicZmanim: {
          Sunrise: "2023-06-21T05:30:00-04:00",
          Sunset: "2023-06-21T19:45:00-04:00",
        },
      };

      // Set up the mock to return our predefined response
      (KosherZmanim.getZmanimJson as jest.Mock).mockReturnValue(
        mockZmanimResponse
      );

      const date = new Date("2023-06-21");
      const latitude = 31.7683;
      const longitude = 35.2137;
      const timezone = "America/New_York"; // Different timezone

      const result = calculateDayTimes(date, latitude, longitude, timezone);

      // Verify KosherZmanim was called with the correct parameters
      expect(KosherZmanim.getZmanimJson).toHaveBeenCalledWith({
        date,
        latitude,
        longitude,
        elevation: 0,
        timeZoneId: timezone,
      });

      // Verify the timezone is set correctly
      expect(result.sunrise.zoneName).toBe(timezone);
      expect(result.sunset.zoneName).toBe(timezone);
    });

    it("should default to Asia/Jerusalem timezone if not provided", () => {
      // Mock the KosherZmanim response
      const mockZmanimResponse = {
        BasicZmanim: {
          Sunrise: "2023-06-21T05:30:00+03:00",
          Sunset: "2023-06-21T19:45:00+03:00",
        },
      };

      // Set up the mock to return our predefined response
      (KosherZmanim.getZmanimJson as jest.Mock).mockReturnValue(
        mockZmanimResponse
      );

      const date = new Date("2023-06-21");
      const latitude = 31.7683;
      const longitude = 35.2137;

      const result = calculateDayTimes(date, latitude, longitude);

      // Verify KosherZmanim was called with the correct parameters
      expect(KosherZmanim.getZmanimJson).toHaveBeenCalledWith({
        date,
        latitude,
        longitude,
        elevation: 0,
        timeZoneId: "Asia/Jerusalem",
      });

      // Verify the default timezone is set
      expect(result.sunrise.zoneName).toBe("Asia/Jerusalem");
      expect(result.sunset.zoneName).toBe("Asia/Jerusalem");
    });
  });
  describe("hasScheduleTimePassed", () => {
    const timezone = "Asia/Jerusalem";

    it("should return true when schedule time has passed", () => {
      // Mock current time as 16:30
      const now = DateTime.fromObject(
        { hour: 16, minute: 30 },
        { zone: timezone }
      );

      // Schedule time is 16:00
      const scheduleContext = { calculatedHour: "16:00" };

      const result = hasScheduleTimePassed(scheduleContext, 0, now, timezone);

      expect(result).toBe(true);
    });

    it("should return false when schedule time has not passed", () => {
      // Mock current time as 15:45
      const now = DateTime.fromObject(
        { hour: 15, minute: 45 },
        { zone: timezone }
      );

      // Schedule time is 16:00
      const scheduleContext = { calculatedHour: "16:00" };

      const result = hasScheduleTimePassed(scheduleContext, 0, now, timezone);

      expect(result).toBe(false);
    });

    it("should respect the grace period when schedule time has just passed", () => {
      // Mock current time as 16:03
      const now = DateTime.fromObject(
        { hour: 16, minute: 3 },
        { zone: timezone }
      );

      // Schedule time is 16:00 with 5 minutes grace period
      const scheduleContext = { calculatedHour: "16:00" };

      const result = hasScheduleTimePassed(scheduleContext, 5, now, timezone);

      expect(result).toBe(false);
    });

    it("should return true when grace period has passed", () => {
      // Mock current time as 16:06
      const now = DateTime.fromObject(
        { hour: 16, minute: 6 },
        { zone: timezone }
      );

      // Schedule time is 16:00 with 5 minutes grace period
      const scheduleContext = { calculatedHour: "16:00" };

      const result = hasScheduleTimePassed(scheduleContext, 5, now, timezone);

      expect(result).toBe(true);
    });

    it("should handle midnight wrapping (schedule time is tomorrow morning)", () => {
      // Mock current time as 23:30 today
      const now = DateTime.fromObject(
        { hour: 23, minute: 30 },
        { zone: timezone }
      );

      // Schedule time is 06:00 (tomorrow morning)
      const scheduleContext = { calculatedHour: "06:00" };

      const result = hasScheduleTimePassed(scheduleContext, 0, now, timezone);

      expect(result).toBe(false);
    });

    it("should handle midnight wrapping (schedule time was yesterday evening)", () => {
      // Mock current time as 02:00 (early morning)
      const now = DateTime.fromObject(
        { hour: 2, minute: 0 },
        { zone: timezone }
      );

      // Schedule time is 22:00 (yesterday evening)
      const scheduleContext = { calculatedHour: "22:00" };

      const result = hasScheduleTimePassed(scheduleContext, 0, now, timezone);

      expect(result).toBe(true);
    });

    it("should handle edge case with grace period crossing midnight", () => {
      // Mock current time as 00:03 (just after midnight)
      const now = DateTime.fromObject(
        { hour: 0, minute: 3 },
        { zone: timezone }
      );

      // Schedule time is 23:59 (just before midnight) with 5 minutes grace
      const scheduleContext = { calculatedHour: "23:59" };

      const result = hasScheduleTimePassed(scheduleContext, 5, now, timezone);

      expect(result).toBe(false);
    });

    it("should handle edge case with grace period after crossing midnight", () => {
      // Mock current time as 00:06 (just after midnight)
      const now = DateTime.fromObject(
        { hour: 0, minute: 6 },
        { zone: timezone }
      );

      // Schedule time is 23:59 (just before midnight) with 5 minutes grace
      const scheduleContext = { calculatedHour: "23:59" };

      const result = hasScheduleTimePassed(scheduleContext, 5, now, timezone);

      expect(result).toBe(true);
    });

    it("should use current time when no reference time is provided", () => {
      // This test depends on the current time, so we'll mock DateTime.now
      const mockNow = DateTime.fromObject(
        { hour: 16, minute: 30 },
        { zone: timezone }
      );
      const originalNow = DateTime.now;

      // Mock DateTime.now
      DateTime.now = jest.fn(() => mockNow as DateTime<true>);

      try {
        // Schedule time is 16:00
        const scheduleContext = { calculatedHour: "16:00" };

        const result = hasScheduleTimePassed(scheduleContext);

        expect(result).toBe(true);
      } finally {
        // Restore original DateTime.now
        DateTime.now = originalNow;
      }
    });
  });

  describe("isScheduleActiveOnDate", () => {
    it("should return true when no date range is configured", () => {
      const schedule = {
        id: 1,
        name: "Test Schedule",
        prayer: Prayer.Shacharit,
        time: "08:00:00",
        enabled: true,
        minyan: mockMinyan,
      } as Schedule;

      const date = new Date("2023-01-15");
      const result = isScheduleActiveOnDate(schedule, date);

      expect(result).toBe(true);
    });

    it("should return true when date is within range (start date only)", () => {
      const schedule = {
        id: 1,
        name: "Test Schedule",
        prayer: Prayer.Shacharit,
        time: "08:00:00",
        enabled: true,
        startAt: new Date("2023-01-01"),
        minyan: mockMinyan,
      } as Schedule;

      const date = new Date("2023-01-15");
      const result = isScheduleActiveOnDate(schedule, date);

      expect(result).toBe(true);
    });

    it("should return false when date is before start date", () => {
      const schedule = {
        id: 1,
        name: "Test Schedule",
        prayer: Prayer.Shacharit,
        time: "08:00:00",
        enabled: true,
        startAt: new Date("2023-01-15"),
        minyan: mockMinyan,
      } as Schedule;

      const date = new Date("2023-01-10");
      const result = isScheduleActiveOnDate(schedule, date);

      expect(result).toBe(false);
    });

    it("should return true when date is within range (end date only)", () => {
      const schedule = {
        id: 1,
        name: "Test Schedule",
        prayer: Prayer.Shacharit,
        time: "08:00:00",
        enabled: true,
        endAt: new Date("2023-01-31"),
        minyan: mockMinyan,
      } as Schedule;

      const date = new Date("2023-01-15");
      const result = isScheduleActiveOnDate(schedule, date);

      expect(result).toBe(true);
    });

    it("should return false when date is after end date", () => {
      const schedule = {
        id: 1,
        name: "Test Schedule",
        prayer: Prayer.Shacharit,
        time: "08:00:00",
        enabled: true,
        endAt: new Date("2023-01-15"),
        minyan: mockMinyan,
      } as Schedule;

      const date = new Date("2023-01-20");
      const result = isScheduleActiveOnDate(schedule, date);

      expect(result).toBe(false);
    });

    it("should return true when date is within both start and end dates", () => {
      const schedule = {
        id: 1,
        name: "Test Schedule",
        prayer: Prayer.Shacharit,
        time: "08:00:00",
        enabled: true,
        startAt: new Date("2023-01-01"),
        endAt: new Date("2023-01-31"),
        minyan: mockMinyan,
      } as Schedule;

      const date = new Date("2023-01-15");
      const result = isScheduleActiveOnDate(schedule, date);

      expect(result).toBe(true);
    });

    it("should return false when date is outside the range", () => {
      const schedule = {
        id: 1,
        name: "Test Schedule",
        prayer: Prayer.Shacharit,
        time: "08:00:00",
        enabled: true,
        startAt: new Date("2023-01-10"),
        endAt: new Date("2023-01-20"),
        minyan: mockMinyan,
      } as Schedule;

      const date = new Date("2023-01-05");
      const result = isScheduleActiveOnDate(schedule, date);

      expect(result).toBe(false);
    });
  });

  describe("isScheduleActiveOnWeekday", () => {
    it("should return true when no weekdays are configured", () => {
      const schedule = {
        id: 1,
        name: "Test Schedule",
        prayer: Prayer.Shacharit,
        time: "08:00:00",
        enabled: true,
        minyan: mockMinyan,
      } as Schedule;

      const date = new Date("2023-01-15"); // Sunday
      const result = isScheduleActiveOnWeekday(schedule, date);

      expect(result).toBe(true);
    });

    it("should return true when weekdays array is empty", () => {
      const schedule = {
        id: 1,
        name: "Test Schedule",
        prayer: Prayer.Shacharit,
        time: "08:00:00",
        enabled: true,
        weekDays: [],
        minyan: mockMinyan,
      } as Schedule;

      const date = new Date("2023-01-15"); // Sunday
      const result = isScheduleActiveOnWeekday(schedule, date);

      expect(result).toBe(true);
    });

    it("should return true when date matches configured weekday (Sunday)", () => {
      const schedule = {
        id: 1,
        name: "Test Schedule",
        prayer: Prayer.Shacharit,
        time: "08:00:00",
        enabled: true,
        weekDays: [WeekDay.Sunday],
        minyan: mockMinyan,
      } as Schedule;

      const date = new Date("2023-01-15"); // Sunday
      const result = isScheduleActiveOnWeekday(schedule, date);

      expect(result).toBe(true);
    });

    it("should return false when date does not match configured weekday", () => {
      const schedule = {
        id: 1,
        name: "Test Schedule",
        prayer: Prayer.Shacharit,
        time: "08:00:00",
        enabled: true,
        weekDays: [WeekDay.Monday],
        minyan: mockMinyan,
      } as Schedule;

      const date = new Date("2023-01-15"); // Sunday
      const result = isScheduleActiveOnWeekday(schedule, date);

      expect(result).toBe(false);
    });

    it("should return true when date matches one of multiple configured weekdays", () => {
      const schedule = {
        id: 1,
        name: "Test Schedule",
        prayer: Prayer.Shacharit,
        time: "08:00:00",
        enabled: true,
        weekDays: [WeekDay.Monday, WeekDay.Wednesday, WeekDay.Friday],
        minyan: mockMinyan,
      } as Schedule;

      const date = new Date("2023-01-18"); // Wednesday
      const result = isScheduleActiveOnWeekday(schedule, date);

      expect(result).toBe(true);
    });

    it("should return false when date does not match any of multiple configured weekdays", () => {
      const schedule = {
        id: 1,
        name: "Test Schedule",
        prayer: Prayer.Shacharit,
        time: "08:00:00",
        enabled: true,
        weekDays: [WeekDay.Monday, WeekDay.Wednesday, WeekDay.Friday],
        minyan: mockMinyan,
      } as Schedule;

      const date = new Date("2023-01-17"); // Tuesday
      const result = isScheduleActiveOnWeekday(schedule, date);

      expect(result).toBe(false);
    });

    it("should handle all weekdays correctly", () => {
      const schedule = {
        id: 1,
        name: "Test Schedule",
        prayer: Prayer.Shacharit,
        time: "08:00:00",
        enabled: true,
        weekDays: [
          WeekDay.Sunday,
          WeekDay.Monday,
          WeekDay.Tuesday,
          WeekDay.Wednesday,
          WeekDay.Thursday,
          WeekDay.Friday,
          WeekDay.Saturday,
        ],
        minyan: mockMinyan,
      } as Schedule;

      // Test each day of the week
      const testDates = [
        { date: new Date("2023-01-15"), day: "Sunday" },
        { date: new Date("2023-01-16"), day: "Monday" },
        { date: new Date("2023-01-17"), day: "Tuesday" },
        { date: new Date("2023-01-18"), day: "Wednesday" },
        { date: new Date("2023-01-19"), day: "Thursday" },
        { date: new Date("2023-01-20"), day: "Friday" },
        { date: new Date("2023-01-21"), day: "Saturday" },
      ];

      testDates.forEach(({ date, day }) => {
        const result = isScheduleActiveOnWeekday(schedule, date);
        expect(result).toBe(true);
      });
    });
  });

  describe("isScheduleRelevantForDate", () => {
    it("should return true when both date range and weekday conditions are met", () => {
      const schedule = {
        id: 1,
        name: "Test Schedule",
        prayer: Prayer.Shacharit,
        time: "08:00:00",
        enabled: true,
        startAt: new Date("2023-01-01"),
        endAt: new Date("2023-01-31"),
        weekDays: [WeekDay.Sunday],
        minyan: mockMinyan,
      } as Schedule;

      const date = new Date("2023-01-15"); // Sunday, within date range
      const result = isScheduleRelevantForDate(schedule, date);

      expect(result).toBe(true);
    });

    it("should return false when date range condition is not met", () => {
      const schedule = {
        id: 1,
        name: "Test Schedule",
        prayer: Prayer.Shacharit,
        time: "08:00:00",
        enabled: true,
        startAt: new Date("2023-01-20"),
        endAt: new Date("2023-01-31"),
        weekDays: [WeekDay.Sunday],
        minyan: mockMinyan,
      } as Schedule;

      const date = new Date("2023-01-15"); // Sunday, but before start date
      const result = isScheduleRelevantForDate(schedule, date);

      expect(result).toBe(false);
    });

    it("should return false when weekday condition is not met", () => {
      const schedule = {
        id: 1,
        name: "Test Schedule",
        prayer: Prayer.Shacharit,
        time: "08:00:00",
        enabled: true,
        startAt: new Date("2023-01-01"),
        endAt: new Date("2023-01-31"),
        weekDays: [WeekDay.Monday],
        minyan: mockMinyan,
      } as Schedule;

      const date = new Date("2023-01-15"); // Sunday, within date range but wrong weekday
      const result = isScheduleRelevantForDate(schedule, date);

      expect(result).toBe(false);
    });

    it("should return true when no constraints are configured", () => {
      const schedule = {
        id: 1,
        name: "Test Schedule",
        prayer: Prayer.Shacharit,
        time: "08:00:00",
        enabled: true,
        minyan: mockMinyan,
      } as Schedule;

      const date = new Date("2023-01-15");
      const result = isScheduleRelevantForDate(schedule, date);

      expect(result).toBe(true);
    });

    it("should return true when only date range is configured and condition is met", () => {
      const schedule = {
        id: 1,
        name: "Test Schedule",
        prayer: Prayer.Shacharit,
        time: "08:00:00",
        enabled: true,
        startAt: new Date("2023-01-01"),
        endAt: new Date("2023-01-31"),
        minyan: mockMinyan,
      } as Schedule;

      const date = new Date("2023-01-15");
      const result = isScheduleRelevantForDate(schedule, date);

      expect(result).toBe(true);
    });

    it("should return true when only weekday is configured and condition is met", () => {
      const schedule = {
        id: 1,
        name: "Test Schedule",
        prayer: Prayer.Shacharit,
        time: "08:00:00",
        enabled: true,
        weekDays: [WeekDay.Sunday],
        minyan: mockMinyan,
      } as Schedule;

      const date = new Date("2023-01-15"); // Sunday
      const result = isScheduleRelevantForDate(schedule, date);

      expect(result).toBe(true);
    });
  });
});
