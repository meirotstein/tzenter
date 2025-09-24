import * as KosherZmanim from "kosher-zmanim";
import { DateTime } from "luxon";
import {
  RelativeTime,
  Schedule,
  WeekDay,
} from "../datasource/entities/Schedule";

export interface DayTimes {
  sunrise: DateTime;
  sunset: DateTime;
}

/**
 * Calculates sunrise and sunset times for a specific date and location
 */
export function calculateDayTimes(
  date: Date,
  latitude: number,
  longitude: number,
  timezone: string = "Asia/Jerusalem"
): DayTimes {
  const zmanimData = KosherZmanim.getZmanimJson({
    date,
    latitude,
    longitude,
    elevation: 0,
    timeZoneId: timezone,
  });

  console.log("Zmanim data:", {
    sunrise: (zmanimData as any).BasicZmanim.Sunrise,
    sunset: (zmanimData as any).BasicZmanim.Sunset,
  });

  return {
    sunrise: DateTime.fromISO((zmanimData as any).BasicZmanim.Sunrise, {
      zone: timezone,
    }),
    sunset: DateTime.fromISO((zmanimData as any).BasicZmanim.Sunset, {
      zone: timezone,
    }),
  };
}

/**
 * Adjusts a date to the specified day of the week in the same week
 * If the date is already on the specified day, it returns the same date
 */
export function adjustDateToWeekDay(date: Date, weekDay: WeekDay): Date {
  const dt = DateTime.fromJSDate(date);
  const currentDayOfWeek = dt.weekday; // Luxon uses 1-7 for Monday-Sunday

  // Convert WeekDay enum (1-7 for Sunday-Saturday) to Luxon weekday (1-7 for Monday-Sunday)
  const targetDayLuxon = weekDay === WeekDay.Sunday ? 7 : weekDay - 1;

  // Calculate the difference in days
  let daysDiff = targetDayLuxon - currentDayOfWeek;

  // If the target day is earlier in the week, move to the next week
  if (daysDiff < 0) {
    daysDiff += 7;
  }

  // If it's the same day, don't add any days
  if (daysDiff === 0) {
    return date;
  }

  return dt.plus({ days: daysDiff }).toJSDate();
}

/**
 * Rounds a DateTime to the nearest 5 minutes
 */
export function roundToFiveMinutes(dt: DateTime): DateTime {
  const minutes = dt.minute;
  const roundedMinutes = Math.round(minutes / 5) * 5;
  return dt.set({
    minute: roundedMinutes % 60,
    hour: dt.hour + Math.floor(roundedMinutes / 60),
    second: 0,
    millisecond: 0,
  });
}

/**
 * Calculates the time for a regular (non-relative) schedule
 */
export function calculateRegularScheduleTime(
  schedule: Schedule,
  referenceDateTime: DateTime
): DateTime {
  const [hours, minutes] = schedule.time.split(":").map(Number);

  // Create time in the same timezone on the same day as the reference
  let scheduleTime = referenceDateTime.set({
    hour: hours,
    minute: minutes,
    second: 0,
    millisecond: 0,
  });

  // Handle midnight wrapping by adjusting the date if needed
  if (scheduleTime < referenceDateTime && hours < 12) {
    // If the time is earlier today and before noon, it's probably meant for tomorrow
    scheduleTime = scheduleTime.plus({ days: 1 });
  }

  return scheduleTime;
}

/**
 * Calculates the time for a relative schedule (based on sunrise/sunset)
 */
export function calculateRelativeScheduleTime(
  schedule: Schedule,
  dayTimes: DayTimes,
  timezone: string,
  referenceDateTime?: DateTime
): DateTime {
  // Use provided reference time or current time
  const now = referenceDateTime || DateTime.now().setZone(timezone);

  const adjustedDayTime = [
    RelativeTime.AFTER_SUNSET,
    RelativeTime.BEFORE_SUNSET,
  ].includes(schedule.relative!)
    ? dayTimes.sunset.setZone(timezone)
    : dayTimes.sunrise.setZone(timezone);

  const baseTime = now.set({
    hour: adjustedDayTime.hour,
    minute: adjustedDayTime.minute,
    second: adjustedDayTime.second,
    millisecond: adjustedDayTime.millisecond,
  });

  const [hours, minutes] = schedule.time.split(":").map(Number);

  let scheduleTime = baseTime;

  // Add or subtract hours and minutes based on BEFORE/AFTER
  if (
    [RelativeTime.BEFORE_SUNRISE, RelativeTime.BEFORE_SUNSET].includes(
      schedule.relative!
    )
  ) {
    scheduleTime = scheduleTime
      .minus({ hours, minutes })
      .set({ second: 0, millisecond: 0 });
  } else {
    scheduleTime = scheduleTime
      .plus({ hours, minutes })
      .set({ second: 0, millisecond: 0 });
  }

  // Round to nearest 5 minutes if needed
  if (schedule.roundToNearestFiveMinutes) {
    scheduleTime = roundToFiveMinutes(scheduleTime);
  }

  return scheduleTime;
}

/**
 * Calculates the actual DateTime for a schedule based on its configuration
 */
export function calculateScheduleTime(
  schedule: Schedule,
  timezone: string = "Asia/Jerusalem",
  dayTimes?: DayTimes,
  referenceDate: Date = new Date()
): DateTime {
  const referenceDateTime =
    DateTime.fromJSDate(referenceDate).setZone(timezone);

  if (!schedule.relative) {
    return calculateRegularScheduleTime(schedule, referenceDateTime);
  } else {
    // For relative schedules, dayTimes must be provided
    if (!dayTimes) {
      console.warn(
        `No dayTimes provided for relative schedule ${schedule.name}. Falling back to regular schedule.`
      );
      return calculateRegularScheduleTime(schedule, referenceDateTime);
    }

    return calculateRelativeScheduleTime(
      schedule,
      dayTimes,
      timezone,
      referenceDateTime
    );
  }
}

/**
 * Determines if a schedule's calculated time falls within a specified time range
 */
export function isScheduleInTimeRange(
  calculatedTime: DateTime,
  startTime: DateTime,
  endTime: DateTime
): boolean {
  // For schedules that wrap around midnight
  const midnight = startTime.plus({ days: 1 }).startOf("day");

  if (endTime.day !== startTime.day) {
    // If period crosses midnight, include:
    // 1. Schedules from now until midnight today
    // 2. Schedules from midnight until 'later' tomorrow
    return (
      (calculatedTime >= startTime && calculatedTime < midnight) ||
      (calculatedTime >= midnight && calculatedTime <= endTime)
    );
  }

  // Normal case (same day)
  return calculatedTime >= startTime && calculatedTime <= endTime;
}

/**
 * Determines if a schedule's time has passed based on the calculatedHour property
 * @param scheduleContext The schedule context object containing calculatedHour
 * @param graceMinutes Optional grace period in minutes (default: 0)
 * @param referenceTime Optional reference time for testing (default: current time)
 * @param timezone Optional timezone (default: Asia/Jerusalem)
 * @returns boolean indicating whether the schedule time has passed
 */
export function hasScheduleTimePassed(
  scheduleContext: { calculatedHour: string },
  graceMinutes: number = 0,
  referenceTime?: DateTime,
  timezone: string = "Asia/Jerusalem"
): boolean {
  // Parse the calculatedHour (HH:mm format)
  const [hours, minutes] = scheduleContext.calculatedHour
    .split(":")
    .map(Number);

  // Get the current time or use the provided reference time
  const now = referenceTime || DateTime.now().setZone(timezone);

  // Create a DateTime object for the schedule time on the same day
  let scheduleTime = now.set({
    hour: hours,
    minute: minutes,
    second: 0,
    millisecond: 0,
  });

  // Handle midnight wrapping by adjusting the date if needed
  const hourDiff = Math.abs(now.hour - hours);

  if (scheduleTime < now && hourDiff > 12) {
    // If the schedule time is earlier than now and the hour difference is significant,
    // it's probably meant for tomorrow
    scheduleTime = scheduleTime.plus({ days: 1 });
  } else if (scheduleTime > now && hourDiff > 12) {
    // If the schedule time is later than now and the hour difference is significant,
    // it's probably meant for yesterday
    scheduleTime = scheduleTime.minus({ days: 1 });
  }

  // Add the grace period to the schedule time
  const adjustedScheduleTime = scheduleTime.plus({ minutes: graceMinutes });

  // Check if the current time has passed the adjusted schedule time
  return now > adjustedScheduleTime;
}

/**
 * Determines if a schedule is active on a specific date based on its date range configuration
 * @param schedule The schedule to check
 * @param date The date to check against
 * @returns boolean indicating whether the schedule is active on the given date
 */
export function isScheduleActiveOnDate(
  schedule: Schedule,
  date: Date
): boolean {
  // If no date range is configured, the schedule is always active
  if (!schedule.startAt && !schedule.endAt) {
    return true;
  }

  const checkDate = DateTime.fromJSDate(date);

  // Check start date
  if (schedule.startAt) {
    const startDate = DateTime.fromJSDate(schedule.startAt);
    if (checkDate < startDate) {
      return false;
    }
  }

  // Check end date
  if (schedule.endAt) {
    const endDate = DateTime.fromJSDate(schedule.endAt);
    if (checkDate > endDate) {
      return false;
    }
  }

  return true;
}

/**
 * Determines if a schedule is active on a specific weekday
 * @param schedule The schedule to check
 * @param date The date to check against
 * @returns boolean indicating whether the schedule is active on the given weekday
 */
export function isScheduleActiveOnWeekday(
  schedule: Schedule,
  date: Date
): boolean {
  // If no weekdays are configured, the schedule is active on all days
  if (!schedule.weekDays || schedule.weekDays.length === 0) {
    return true;
  }

  const dt = DateTime.fromJSDate(date);
  // Convert Luxon weekday (1-7 for Monday-Sunday) to WeekDay enum (1-7 for Sunday-Saturday)
  // Luxon: 1=Monday, 2=Tuesday, ..., 7=Sunday
  // WeekDay: 1=Sunday, 2=Monday, ..., 7=Saturday
  const currentWeekDay =
    dt.weekday === 7 ? WeekDay.Sunday : ((dt.weekday + 1) as WeekDay);

  // Convert weekDays to numbers since TypeORM simple-array stores them as strings
  const weekDaysAsNumbers = schedule.weekDays.map((day) =>
    typeof day === "string" ? parseInt(day) : day
  );

  return weekDaysAsNumbers.includes(currentWeekDay);
}

/**
 * Determines if a schedule is relevant for a specific date based on both date range and weekday configurations
 * @param schedule The schedule to check
 * @param date The date to check against
 * @returns boolean indicating whether the schedule is relevant for the given date
 */
export function isScheduleRelevantForDate(
  schedule: Schedule,
  date: Date
): boolean {
  return (
    isScheduleActiveOnDate(schedule, date) &&
    isScheduleActiveOnWeekday(schedule, date)
  );
}
