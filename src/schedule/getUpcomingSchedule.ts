import { DateTime } from "luxon";
import { Schedule } from "../datasource/entities/Schedule";
import { getAllSchedules } from "../datasource/scheduleRepository";
import {
  DayTimes,
  calculateDayTimes,
  calculateScheduleTime,
  isScheduleInTimeRange,
} from "./scheduleTimeUtils";

export interface ScheduleWithCalculatedTime extends Schedule {
  calculatedHour: string;
}

export async function getUpcomingSchedules(
  minutes: number,
  from: Date = new Date(),
  timezone: string = "Asia/Jerusalem",
  enabled: boolean = true
): Promise<ScheduleWithCalculatedTime[]> {
  // Convert input UTC date to target timezone
  const now = DateTime.fromJSDate(from).setZone(timezone);
  const later = now.plus({ minutes });

  // Get schedules with enabled flag
  const schedules = await getAllSchedules(enabled);

  // Calculate actual times for each schedule and filter those within range
  const result = schedules
    .map((schedule) => {
      // Calculate dayTimes if the schedule is relative and has coordinates
      let dayTimes: DayTimes | undefined = undefined;

      if (
        schedule.relative &&
        schedule.minyan.latitude &&
        schedule.minyan.longitude
      ) {
        // If weeklyDetermineByDay is set, we need to adjust the date
        let dateForDayTimes = from;

        if (schedule.weeklyDetermineByDay) {
          const dt = DateTime.fromJSDate(from);
          const currentDayOfWeek = dt.weekday; // Luxon uses 1-7 for Monday-Sunday

          // Convert WeekDay enum (1-7 for Sunday-Saturday) to Luxon weekday (1-7 for Monday-Sunday)
          const targetDayLuxon =
            schedule.weeklyDetermineByDay === 1
              ? 7
              : schedule.weeklyDetermineByDay - 1;

          // Calculate the difference in days
          let daysDiff = targetDayLuxon - currentDayOfWeek;

          // If the target day is earlier in the week, move to the next week
          if (daysDiff < 0) {
            daysDiff += 7;
          }

          // If it's not the same day, adjust the date
          if (daysDiff !== 0) {
            dateForDayTimes = dt.plus({ days: daysDiff }).toJSDate();
          }
        }

        dayTimes = calculateDayTimes(
          dateForDayTimes,
          schedule.minyan.latitude,
          schedule.minyan.longitude,
          timezone
        );
      }

      const calculatedTime = calculateScheduleTime(
        schedule,
        timezone,
        dayTimes,
        from
      );
      return { ...schedule, calculatedTime };
    })
    .filter((schedule) =>
      isScheduleInTimeRange(schedule.calculatedTime, now, later)
    )
    .map((schedule) => ({
      ...schedule,
      calculatedHour: schedule.calculatedTime.toFormat("HH:mm"),
    }));

  return result;
}
