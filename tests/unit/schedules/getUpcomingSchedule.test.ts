import {
  Prayer,
  RelativeTime,
  WeekDay,
} from "../../../src/datasource/entities/Schedule";
import { DateTime } from "luxon";
import { saveMinyan } from "../../../src/datasource/minyansRepository";
import {
  addSchedule,
  getRepo as getScheduleRepo,
} from "../../../src/datasource/scheduleRepository";
import { getUpcomingSchedules } from "../../../src/schedule/getUpcomingSchedule";

describe("getUpcomingSchedules", () => {
  afterEach(async () => {
    const scheduleRepo = await getScheduleRepo();
    await scheduleRepo.clear();
  });

  it("should fetch upcoming schedules within the specified time range", async () => {
    const minyan = { id: 1, name: "Main Hall", city: "Bruchin" };

    const savedMinyan = await saveMinyan(minyan);

    const schedules = [
      {
        name: "Morning Prayer",
        prayer: Prayer.Shacharit,
        time: "08:00:00",
        minyan: savedMinyan,
      },
      {
        name: "Afternoon Prayer",
        prayer: Prayer.Mincha,
        time: "13:00:00",
        minyan: savedMinyan,
      },
      {
        name: "Evening Prayer",
        prayer: Prayer.Arvit,
        time: "19:00:00",
        minyan: savedMinyan,
      },
    ];

    for (const schedule of schedules) {
      await addSchedule(schedule);
    }

    const fromDate = new Date("2023-01-01T07:00:00");
    const upcomingSchedules = await getUpcomingSchedules(360, fromDate); // 360 minutes = 6 hours

    expect(upcomingSchedules).toHaveLength(2);
    expect(upcomingSchedules[0].name).toBe("Morning Prayer");
    expect(upcomingSchedules[1].name).toBe("Afternoon Prayer");
  });

  it("should fetch upcoming schedules within the specified time range considering a different timezone", async () => {
    const minyan = { id: 1, name: "Main Hall", city: "Bruchin" };

    const savedMinyan = await saveMinyan(minyan);

    const schedules = [
      {
        name: "Morning Prayer",
        prayer: Prayer.Shacharit,
        time: "08:00:00",
        minyan: savedMinyan,
      },
      {
        name: "Afternoon Prayer",
        prayer: Prayer.Mincha,
        time: "13:00:00",
        minyan: savedMinyan,
      },
      {
        name: "Evening Prayer",
        prayer: Prayer.Arvit,
        time: "19:00:00",
        minyan: savedMinyan,
      },
    ];

    for (const schedule of schedules) {
      await addSchedule(schedule);
    }

    const fromDate = new Date("2023-01-01T07:00:00Z"); // UTC time
    const timezone = "America/New_York"; // Different timezone to consider
    const upcomingSchedules = await getUpcomingSchedules(
      360,
      fromDate,
      timezone
    ); // 360 minutes = 6 hours

    expect(upcomingSchedules).toHaveLength(1);
    expect(upcomingSchedules[0].name).toBe("Morning Prayer");
  });

  it("should fetch upcoming schedules that wrap around midnight", async () => {
    const minyan = { id: 1, name: "Main Hall", city: "Bruchin" };

    const savedMinyan = await saveMinyan(minyan);

    const schedules = [
      {
        name: "Late Night Prayer",
        prayer: Prayer.Arvit,
        time: "23:30:00",
        minyan: savedMinyan,
      },
      {
        name: "Early Morning Prayer",
        prayer: Prayer.Shacharit,
        time: "00:30:00",
        minyan: savedMinyan,
      },
      {
        name: "Morning Prayer",
        prayer: Prayer.Shacharit,
        time: "08:00:00",
        minyan: savedMinyan,
      },
    ];

    for (const schedule of schedules) {
      await addSchedule(schedule);
    }

    const fromDate = new Date("2023-01-01T23:00:00");
    const upcomingSchedules = await getUpcomingSchedules(120, fromDate); // 120 minutes = 2 hours

    expect(upcomingSchedules).toHaveLength(2);
    expect(upcomingSchedules[0].name).toBe("Late Night Prayer");
    expect(upcomingSchedules[1].name).toBe("Early Morning Prayer");
  });

  it("should return an empty array if no schedules are found in the specified time range", async () => {
    const minyan = { id: 1, name: "Main Hall", city: "Bruchin" };

    const savedMinyan = await saveMinyan(minyan);

    const schedules = [
      {
        name: "Morning Prayer",
        prayer: Prayer.Shacharit,
        time: "08:00:00",
        minyan: savedMinyan,
      },
      {
        name: "Afternoon Prayer",
        prayer: Prayer.Mincha,
        time: "13:00:00",
        minyan: savedMinyan,
      },
    ];

    for (const schedule of schedules) {
      await addSchedule(schedule);
    }

    const fromDate = new Date("2023-01-01T20:00:00");
    const upcomingSchedules = await getUpcomingSchedules(60, fromDate); // 60 minutes = 1 hour

    expect(upcomingSchedules).toHaveLength(0);
  });

  it("should handle schedules with overlapping times correctly", async () => {
    const minyan = { id: 1, name: "Main Hall", city: "Bruchin" };

    const savedMinyan = await saveMinyan(minyan);

    const schedules = [
      {
        name: "Overlap Prayer 1",
        prayer: Prayer.Shacharit,
        time: "08:00:00",
        minyan: savedMinyan,
      },
      {
        name: "Overlap Prayer 2",
        prayer: Prayer.Mincha,
        time: "08:00:00",
        minyan: savedMinyan,
      },
    ];

    for (const schedule of schedules) {
      await addSchedule(schedule);
    }

    const fromDate = new Date("2023-01-01T07:00:00");
    const upcomingSchedules = await getUpcomingSchedules(120, fromDate); // 120 minutes = 2 hours

    expect(upcomingSchedules).toHaveLength(2);
    expect(upcomingSchedules[0].name).toBe("Overlap Prayer 1");
    expect(upcomingSchedules[1].name).toBe("Overlap Prayer 2");
  });

  it("should only fetch schedules that are enabled", async () => {
    const minyan = { id: 1, name: "Main Hall", city: "Bruchin" };

    const savedMinyan = await saveMinyan(minyan);

    const schedules = [
      {
        name: "Enabled Prayer",
        prayer: Prayer.Shacharit,
        time: "08:00:00",
        minyan: savedMinyan,
        enabled: true,
      },
      {
        name: "Disabled Prayer",
        prayer: Prayer.Mincha,
        time: "13:00:00",
        minyan: savedMinyan,
        enabled: false,
      },
    ];

    for (const schedule of schedules) {
      await addSchedule(schedule);
    }

    const fromDate = new Date("2023-01-01T07:00:00");
    const upcomingSchedules = await getUpcomingSchedules(360, fromDate); // 360 minutes = 6 hours

    expect(upcomingSchedules).toHaveLength(1);
    expect(upcomingSchedules[0].name).toBe("Enabled Prayer");
  });

  it("should return an empty array if all schedules are disabled", async () => {
    const minyan = { id: 1, name: "Main Hall", city: "Bruchin" };

    const savedMinyan = await saveMinyan(minyan);

    const schedules = [
      {
        name: "Disabled Prayer 1",
        prayer: Prayer.Shacharit,
        time: "08:00:00",
        minyan: savedMinyan,
        enabled: false,
      },
      {
        name: "Disabled Prayer 2",
        prayer: Prayer.Mincha,
        time: "13:00:00",
        minyan: savedMinyan,
        enabled: false,
      },
    ];

    for (const schedule of schedules) {
      await addSchedule(schedule);
    }

    const fromDate = new Date("2023-01-01T07:00:00");
    const upcomingSchedules = await getUpcomingSchedules(360, fromDate); // 360 minutes = 6 hours

    expect(upcomingSchedules).toHaveLength(0);
  });

  it("should handle relative schedules based on sunrise and sunset", async () => {
    const minyan = { id: 1, name: "Main Hall", city: "Bruchin" };
    const savedMinyan = await saveMinyan(minyan);

    const schedules = [
      {
        name: "Before Sunrise Prayer",
        prayer: Prayer.Shacharit,
        time: "1:30:00",
        minyan: savedMinyan,
        relative: RelativeTime.BEFORE_SUNRISE,
      },
      {
        name: "After Sunrise Prayer",
        prayer: Prayer.Shacharit,
        time: "0:30:00",
        minyan: savedMinyan,
        relative: RelativeTime.AFTER_SUNRISE,
      },
      {
        name: "Before Sunset Prayer",
        prayer: Prayer.Mincha,
        time: "1:00:00",
        minyan: savedMinyan,
        relative: RelativeTime.BEFORE_SUNSET,
      },
      {
        name: "After Sunset Prayer",
        prayer: Prayer.Arvit,
        time: "0:20:00",
        minyan: savedMinyan,
        relative: RelativeTime.AFTER_SUNSET,
      },
    ];

    for (const schedule of schedules) {
      await addSchedule(schedule);
    }

    const fromDate = new Date("2023-01-01T04:00:00");
    
    // Mock the coordinates for the minyan to ensure proper dayTimes calculation
    savedMinyan.latitude = 31.9; // Jerusalem latitude
    savedMinyan.longitude = 35.2; // Jerusalem longitude
    await saveMinyan(savedMinyan);
    
    // Note: With these coordinates, KosherZmanim calculates the following dayTimes:
    // - Sunrise: ~06:39 AM
    // - Sunset: ~16:45 PM

    const upcomingSchedules = await getUpcomingSchedules(
      1440, // 24 hours
      fromDate,
      "Asia/Jerusalem",
      true
    );

    expect(upcomingSchedules).toHaveLength(4);
    
    // Check names
    expect(upcomingSchedules[0].name).toBe("Before Sunrise Prayer"); // 05:30 AM
    expect(upcomingSchedules[1].name).toBe("After Sunrise Prayer"); // 06:30 AM
    expect(upcomingSchedules[2].name).toBe("Before Sunset Prayer"); // 15:00 PM
    expect(upcomingSchedules[3].name).toBe("After Sunset Prayer"); // 16:20 PM
    
    // Check calculatedHour values
    expect(upcomingSchedules[0].calculatedHour).toBeDefined();
    expect(upcomingSchedules[1].calculatedHour).toBeDefined();
    expect(upcomingSchedules[2].calculatedHour).toBeDefined();
    expect(upcomingSchedules[3].calculatedHour).toBeDefined();
    
    // Verify time format (HH:mm)
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    expect(timeRegex.test(upcomingSchedules[0].calculatedHour)).toBe(true);
    expect(timeRegex.test(upcomingSchedules[1].calculatedHour)).toBe(true);
    expect(timeRegex.test(upcomingSchedules[2].calculatedHour)).toBe(true);
    expect(timeRegex.test(upcomingSchedules[3].calculatedHour)).toBe(true);
    
    // Verify specific time values
    // Before Sunrise Prayer (1:30 before sunrise which is at 06:39:26)
    expect(upcomingSchedules[0].calculatedHour).toBe("05:09");
    
    // After Sunrise Prayer (0:30 after sunrise which is at 06:39:26)
    expect(upcomingSchedules[1].calculatedHour).toBe("07:09");
    
    // Before Sunset Prayer (1:00 before sunset which is at 16:45:51)
    expect(upcomingSchedules[2].calculatedHour).toBe("15:45");
    
    // After Sunset Prayer (0:20 after sunset which is at 16:45:51)
    expect(upcomingSchedules[3].calculatedHour).toBe("17:05");
  });

  it("should handle relative schedules with roundToNearestFiveMinutes", async () => {
    const minyan = { id: 1, name: "Main Hall", city: "Bruchin" };
    const savedMinyan = await saveMinyan(minyan);

    const schedules = [
      {
        name: "Rounded After Sunrise",
        prayer: Prayer.Shacharit,
        time: "0:33:00", // Should round to 0:35
        minyan: savedMinyan,
        relative: RelativeTime.AFTER_SUNRISE,
        roundToNearestFiveMinutes: true,
      },
      {
        name: "Rounded Before Sunset",
        prayer: Prayer.Mincha,
        time: "1:28:00", // Should round to 1:30
        minyan: savedMinyan,
        relative: RelativeTime.BEFORE_SUNSET,
        roundToNearestFiveMinutes: true,
      },
    ];

    for (const schedule of schedules) {
      await addSchedule(schedule);
    }

    const fromDate = new Date("2023-01-01T04:00:00");
    
    // Mock the coordinates for the minyan to ensure proper dayTimes calculation
    savedMinyan.latitude = 31.9; // Jerusalem latitude
    savedMinyan.longitude = 35.2; // Jerusalem longitude
    await saveMinyan(savedMinyan);
    
    // Note: With these coordinates, KosherZmanim calculates the following dayTimes:
    // - Sunrise: ~06:39 AM
    // - Sunset: ~16:45 PM

    const upcomingSchedules = await getUpcomingSchedules(
      1440,
      fromDate,
      "Asia/Jerusalem",
      true
    );

    expect(upcomingSchedules).toHaveLength(2);
    
    // Check names
    expect(upcomingSchedules[0].name).toBe("Rounded After Sunrise");
    expect(upcomingSchedules[1].name).toBe("Rounded Before Sunset");
    
    // Check calculatedHour values
    expect(upcomingSchedules[0].calculatedHour).toBeDefined();
    expect(upcomingSchedules[1].calculatedHour).toBeDefined();
    
    // Verify time format (HH:mm)
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    expect(timeRegex.test(upcomingSchedules[0].calculatedHour)).toBe(true);
    expect(timeRegex.test(upcomingSchedules[1].calculatedHour)).toBe(true);
    
    // Verify minutes are multiples of 5 (rounded)
    const [, minutes0] = upcomingSchedules[0].calculatedHour.split(':');
    const [, minutes1] = upcomingSchedules[1].calculatedHour.split(':');
    expect(parseInt(minutes0) % 5).toBe(0);
    expect(parseInt(minutes1) % 5).toBe(0);
    
    // Verify specific time values
    // Rounded After Sunrise (0:33 after sunrise which is at 06:39:26, rounded to nearest 5 minutes)
    expect(upcomingSchedules[0].calculatedHour).toBe("07:10");
    
    // Rounded Before Sunset (1:28 before sunset which is at 16:45:51, rounded to nearest 5 minutes)
    expect(upcomingSchedules[1].calculatedHour).toBe("15:15");
  });

  it("should handle relative schedules with weeklyDetermineByDay", async () => {
    const minyan = { id: 1, name: "Main Hall", city: "Bruchin" };
    const savedMinyan = await saveMinyan(minyan);

    // January 1st 2023 is a Sunday (weekday 7)
    const schedules = [
      {
        name: "Tuesday Sunrise Prayer",
        prayer: Prayer.Shacharit,
        time: "0:30:00",
        minyan: savedMinyan,
        relative: RelativeTime.AFTER_SUNRISE,
        weeklyDetermineByDay: WeekDay.Tuesday,
      },
      {
        name: "Friday Sunset Prayer",
        prayer: Prayer.Mincha,
        time: "1:00:00",
        minyan: savedMinyan,
        relative: RelativeTime.BEFORE_SUNSET,
        weeklyDetermineByDay: WeekDay.Friday,
      },
    ];

    for (const schedule of schedules) {
      await addSchedule(schedule);
    }

    const fromDate = new Date("2023-01-01T04:00:00"); // Sunday
    
    // Mock the coordinates for the minyan to ensure proper dayTimes calculation
    savedMinyan.latitude = 31.9; // Jerusalem latitude
    savedMinyan.longitude = 35.2; // Jerusalem longitude
    await saveMinyan(savedMinyan);
    
    // Note: With these coordinates, KosherZmanim calculates the following dayTimes:
    // - Sunrise: ~06:39 AM
    // - Sunset: ~16:45 PM

    const upcomingSchedules = await getUpcomingSchedules(
      10080, // 7 days in minutes
      fromDate,
      "Asia/Jerusalem",
      true
    );

    expect(upcomingSchedules).toHaveLength(2);
    
    // Check names
    expect(upcomingSchedules[0].name).toBe("Tuesday Sunrise Prayer");
    expect(upcomingSchedules[1].name).toBe("Friday Sunset Prayer");
    
    // Check calculatedHour values
    expect(upcomingSchedules[0].calculatedHour).toBeDefined();
    expect(upcomingSchedules[1].calculatedHour).toBeDefined();
    
    // Verify time format (HH:mm)
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    expect(timeRegex.test(upcomingSchedules[0].calculatedHour)).toBe(true);
    expect(timeRegex.test(upcomingSchedules[1].calculatedHour)).toBe(true);
    
    // Verify specific time values
    // Tuesday Sunrise Prayer (0:30 after sunrise which is at 06:39:51 on Tuesday)
    expect(upcomingSchedules[0].calculatedHour).toBe("07:09");
    
    // Friday Sunset Prayer (1:00 before sunset which is at 16:49:39 on Friday)
    expect(upcomingSchedules[1].calculatedHour).toBe("15:49");
  });
  it("should not return relative schedules that fall outside the specified time range", async () => {
    const minyan = { id: 1, name: "Main Hall", city: "Bruchin" };
    const savedMinyan = await saveMinyan(minyan);

    // Create schedules that will fall outside our 10 AM - 12 PM test window
    const schedules = [
      {
        name: "Before Sunrise Prayer - Outside Range",
        prayer: Prayer.Shacharit,
        time: "3:00:00", // 3 hours before sunrise = 3 AM (outside 10 AM - 12 PM)
        minyan: savedMinyan,
        relative: RelativeTime.BEFORE_SUNRISE,
      },
      {
        name: "After Sunrise Prayer - Outside Range",
        prayer: Prayer.Shacharit,
        time: "7:00:00", // 7 hours after sunrise = 1 PM (outside 10 AM - 12 PM)
        minyan: savedMinyan,
        relative: RelativeTime.AFTER_SUNRISE,
      },
      {
        name: "Before Sunset Prayer - Outside Range",
        prayer: Prayer.Mincha,
        time: "8:00:00", // 8 hours before sunset = 9 AM (outside 10 AM - 12 PM)
        minyan: savedMinyan,
        relative: RelativeTime.BEFORE_SUNSET,
      },
      {
        name: "After Sunset Prayer - Outside Range",
        prayer: Prayer.Arvit,
        time: "1:00:00", // 1 hour after sunset = 6 PM (outside 10 AM - 12 PM)
        minyan: savedMinyan,
        relative: RelativeTime.AFTER_SUNSET,
      },
    ];

    for (const schedule of schedules) {
      await addSchedule(schedule);
    }

    const fromDate = new Date("2023-01-01T10:00:00"); // 10 AM
    
    // Mock the coordinates for the minyan to ensure proper dayTimes calculation
    savedMinyan.latitude = 31.9; // Jerusalem latitude
    savedMinyan.longitude = 35.2; // Jerusalem longitude
    await saveMinyan(savedMinyan);
    
    // Note: With these coordinates, KosherZmanim calculates the following dayTimes:
    // - Sunrise: ~06:39 AM
    // - Sunset: ~16:45 PM

    // Only look for schedules in a 2-hour window (10 AM - 12 PM)
    const upcomingSchedules = await getUpcomingSchedules(
      120, // 2 hours
      fromDate,
      "Asia/Jerusalem",
      true
    );

    // None of the relative schedules should be in this timeframe
    expect(upcomingSchedules).toHaveLength(0);
  });

  it("should only return relative schedules that fall within the specified time range", async () => {
    const minyan = { id: 1, name: "Main Hall", city: "Bruchin" };
    const savedMinyan = await saveMinyan(minyan);

    // Create a mix of schedules inside and outside our 10 AM - 12 PM test window
    const schedules = [
      {
        name: "Before Sunrise Prayer - Outside Range",
        prayer: Prayer.Shacharit,
        time: "3:00:00", // 3 hours before sunrise = 3 AM (outside 10 AM - 12 PM)
        minyan: savedMinyan,
        relative: RelativeTime.BEFORE_SUNRISE,
      },
      {
        name: "After Sunrise Prayer - Within Range",
        prayer: Prayer.Shacharit,
        time: "4:30:00", // 4.5 hours after sunrise = 10:30 AM (within 10 AM - 12 PM)
        minyan: savedMinyan,
        relative: RelativeTime.AFTER_SUNRISE,
      },
      {
        name: "Before Sunset Prayer - Within Range",
        prayer: Prayer.Mincha,
        time: "6:00:00", // 6 hours before sunset = 11 AM (within 10 AM - 12 PM)
        minyan: savedMinyan,
        relative: RelativeTime.BEFORE_SUNSET,
      },
      {
        name: "After Sunset Prayer - Outside Range",
        prayer: Prayer.Arvit,
        time: "1:00:00", // 1 hour after sunset = 6 PM (outside 10 AM - 12 PM)
        minyan: savedMinyan,
        relative: RelativeTime.AFTER_SUNSET,
      },
    ];

    for (const schedule of schedules) {
      await addSchedule(schedule);
    }

    const fromDate = new Date("2023-01-01T10:00:00"); // 10 AM
    
    // Mock the coordinates for the minyan to ensure proper dayTimes calculation
    savedMinyan.latitude = 31.9; // Jerusalem latitude
    savedMinyan.longitude = 35.2; // Jerusalem longitude
    await saveMinyan(savedMinyan);
    
    // Note: With these coordinates, KosherZmanim calculates the following dayTimes:
    // - Sunrise: ~06:39 AM
    // - Sunset: ~16:45 PM

    // Look for schedules in a 2-hour window (10 AM - 12 PM)
    const upcomingSchedules = await getUpcomingSchedules(
      120, // 2 hours
      fromDate,
      "Asia/Jerusalem",
      true
    );

    // Only the schedules within the 10 AM - 12 PM timeframe should be returned
    expect(upcomingSchedules).toHaveLength(2);
    
    // Check names
    expect(upcomingSchedules[0].name).toBe(
      "After Sunrise Prayer - Within Range"
    );
    expect(upcomingSchedules[1].name).toBe(
      "Before Sunset Prayer - Within Range"
    );
    
    // Check calculatedHour values
    expect(upcomingSchedules[0].calculatedHour).toBeDefined();
    expect(upcomingSchedules[1].calculatedHour).toBeDefined();
    
    // Verify time format (HH:mm)
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    expect(timeRegex.test(upcomingSchedules[0].calculatedHour)).toBe(true);
    expect(timeRegex.test(upcomingSchedules[1].calculatedHour)).toBe(true);
    
    // Verify times are within the 10 AM - 12 PM range
    const hour0 = parseInt(upcomingSchedules[0].calculatedHour.split(':')[0]);
    const hour1 = parseInt(upcomingSchedules[1].calculatedHour.split(':')[0]);
    expect(hour0).toBeGreaterThanOrEqual(10);
    expect(hour0).toBeLessThan(12);
    expect(hour1).toBeGreaterThanOrEqual(10);
    expect(hour1).toBeLessThan(12);
    
    // Verify specific time values
    // After Sunrise Prayer - Within Range (4:30 after sunrise which is at 06:39:26)
    expect(upcomingSchedules[0].calculatedHour).toBe("11:09");
    
    // Before Sunset Prayer - Within Range (6:00 before sunset which is at 16:45:51)
    expect(upcomingSchedules[1].calculatedHour).toBe("10:45");
  });

  it("should handle relative schedules with weeklyDetermineByDay that fall outside the time range", async () => {
    const minyan = { id: 1, name: "Main Hall", city: "Bruchin" };
    const savedMinyan = await saveMinyan(minyan);

    // January 1st 2023 is a Sunday (weekday 1)
    const schedules = [
      {
        name: "Tuesday Sunrise Prayer - Outside Range",
        prayer: Prayer.Shacharit,
        time: "7:00:00", // 7 hours after sunrise = 1 PM (outside 10 AM - 11 AM)
        minyan: savedMinyan,
        relative: RelativeTime.AFTER_SUNRISE,
        weeklyDetermineByDay: WeekDay.Tuesday,
      },
      {
        name: "Friday Sunset Prayer - Outside Range",
        prayer: Prayer.Mincha,
        time: "8:00:00", // 8 hours before sunset = 9 AM (outside 10 AM - 11 AM)
        minyan: savedMinyan,
        relative: RelativeTime.BEFORE_SUNSET,
        weeklyDetermineByDay: WeekDay.Friday,
      },
    ];

    for (const schedule of schedules) {
      await addSchedule(schedule);
    }

    const fromDate = new Date("2023-01-01T10:00:00"); // Sunday 10 AM
    
    // Mock the coordinates for the minyan to ensure proper dayTimes calculation
    savedMinyan.latitude = 31.9; // Jerusalem latitude
    savedMinyan.longitude = 35.2; // Jerusalem longitude
    await saveMinyan(savedMinyan);
    
    // Note: With these coordinates, KosherZmanim calculates the following dayTimes:
    // - Sunrise: ~06:39 AM
    // - Sunset: ~16:45 PM

    // Look for schedules in a 1-hour window (10 AM - 11 AM)
    const upcomingSchedules = await getUpcomingSchedules(
      60, // 1 hour
      fromDate,
      "Asia/Jerusalem",
      true
    );

    // None of the schedules should be in this timeframe
    expect(upcomingSchedules).toHaveLength(0);
  });
});
