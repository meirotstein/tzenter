import { DateTime } from "luxon";
import { Schedule } from "../datasource/entities/Schedule";
import { getAllSchedules } from "../datasource/scheduleRepository";

export interface DayTimes {
  sunrise: DateTime;
  sunset: DateTime;
}

export async function getUpcomingSchedules(
  minutes: number,
  from: Date = new Date(),
  timezone: string = "Asia/Jerusalem",
  enabled: boolean = true,
  dayTimes?: DayTimes
): Promise<Schedule[]> {
  // Convert input UTC date to target timezone
  const now = DateTime.fromJSDate(from).setZone(timezone);
  const later = now.plus({ minutes });

  // Helper function to round to nearest 5 minutes
  const roundToFiveMinutes = (dt: DateTime): DateTime => {
    const minutes = dt.minute;
    const roundedMinutes = Math.round(minutes / 5) * 5;
    return dt.set({ minute: roundedMinutes });
  };

  // Get schedules with enabled flag
  const schedules = await getAllSchedules(enabled);

  // Calculate actual times for each schedule
  const schedulesWithTimes = schedules.map((schedule) => {
    let scheduleTime: DateTime;

    if (!schedule.relative || !dayTimes) {
      // Regular schedule - use configured time directly
      const [hours, minutes] = schedule.time.split(":").map(Number);

      // Create time in target timezone on the same day as 'now'
      scheduleTime = now.set({
        hour: hours,
        minute: minutes,
        second: 0,
        millisecond: 0,
      });

      // Handle midnight wrapping by adjusting the date if needed
      if (scheduleTime < now && hours < 12) {
        // If the time is earlier today and before noon, it's probably meant for tomorrow
        scheduleTime = scheduleTime.plus({ days: 1 });
      }
    } else {
      // Relative schedule - calculate based on sunrise/sunset
      const baseTime = schedule.relative.includes("SUNSET")
        ? dayTimes.sunset.setZone(timezone)
        : dayTimes.sunrise.setZone(timezone);

      const [hours] = schedule.time.split(":").map(Number);

      // If weeklyDetermineByDay is set, adjust the date to that day of the week
      if (schedule.weeklyDetermineByDay) {
        const targetDay = schedule.weeklyDetermineByDay;
        const currentDay = now.weekday;
        const daysToAdd = (targetDay - currentDay + 7) % 7;
        scheduleTime = baseTime.plus({ days: daysToAdd });
      } else {
        scheduleTime = baseTime;
      }

      // Add or subtract hours based on BEFORE/AFTER
      if (schedule.relative.startsWith("BEFORE")) {
        scheduleTime = scheduleTime.minus({ hours });
      } else {
        scheduleTime = scheduleTime.plus({ hours });
      }

      // Round to nearest 5 minutes if needed
      if (schedule.roundToNearestFiveMinutes) {
        scheduleTime = roundToFiveMinutes(scheduleTime);
      }
    }

    return {
      ...schedule,
      calculatedTime: scheduleTime,
    };
  });

  // Filter schedules within the time range
  return schedulesWithTimes
    .filter((schedule) => {
      const { calculatedTime } = schedule;

      // For schedules that wrap around midnight
      const midnight = now.plus({ days: 1 }).startOf("day");

      if (later.day !== now.day) {
        // If period crosses midnight, include:
        // 1. Schedules from now until midnight today
        // 2. Schedules from midnight until 'later' tomorrow
        return (
          (calculatedTime >= now && calculatedTime < midnight) ||
          (calculatedTime >= midnight && calculatedTime <= later)
        );
      }

      // Normal case (same day)
      return calculatedTime >= now && calculatedTime <= later;
    })
    .map(({ calculatedTime, ...schedule }) => schedule);
}
