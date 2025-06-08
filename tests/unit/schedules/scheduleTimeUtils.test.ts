import { DateTime } from "luxon";
import {
  calculateScheduleTime,
  isScheduleInTimeRange,
  roundToFiveMinutes,
  calculateDayTimes
} from "../../../src/schedule/scheduleTimeUtils";
import { Prayer, RelativeTime, WeekDay } from "../../../src/datasource/entities/Schedule";
import { Schedule } from "../../../src/datasource/entities/Schedule";
import { Minyan } from "../../../src/datasource/entities/Minyan";

// Mock KosherZmanim module
jest.mock("kosher-zmanim", () => ({
  getZmanimJson: jest.fn()
}));
import * as KosherZmanim from "kosher-zmanim";

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
      const result = calculateScheduleTime(schedule, timezone, undefined, referenceDate);
      
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
      const result = calculateScheduleTime(schedule, timezone, undefined, referenceDate);
      
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
      const result = calculateScheduleTime(schedule, timezone, dayTimes, referenceDate);
      
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
      const result = calculateScheduleTime(schedule, timezone, dayTimes, referenceDate);
      
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
      const result = calculateScheduleTime(schedule, timezone, dayTimes, referenceDate);
      
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
      const result = calculateScheduleTime(schedule, timezone, dayTimes, referenceDate);
      
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
          Sunset: "2023-06-21T19:45:00+03:00"
        }
      };
      
      // Set up the mock to return our predefined response
      (KosherZmanim.getZmanimJson as jest.Mock).mockReturnValue(mockZmanimResponse);
      
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
      expect(result).toHaveProperty('sunrise');
      expect(result).toHaveProperty('sunset');
      
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
          Sunset: "2023-06-21T19:45:00-04:00"
        }
      };
      
      // Set up the mock to return our predefined response
      (KosherZmanim.getZmanimJson as jest.Mock).mockReturnValue(mockZmanimResponse);
      
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
          Sunset: "2023-06-21T19:45:00+03:00"
        }
      };
      
      // Set up the mock to return our predefined response
      (KosherZmanim.getZmanimJson as jest.Mock).mockReturnValue(mockZmanimResponse);
      
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
});