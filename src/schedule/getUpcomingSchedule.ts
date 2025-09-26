import { DateTime } from "luxon";
import { Schedule } from "../datasource/entities/Schedule";
import { getAllSchedules } from "../datasource/scheduleRepository";
import { shouldSkipSchedule } from "../utils";
import {
  DayTimes,
  calculateDayTimes,
  calculateScheduleTime,
  isScheduleInTimeRange,
  isScheduleRelevantForDate,
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

  // Filter schedules by relevance and configuration
  const filteredSchedules = [];
  for (const schedule of schedules) {
    if (isScheduleRelevantForDate(schedule, from)) {
      const shouldSkip = await shouldSkipSchedule(schedule, from);
      if (!shouldSkip) {
        filteredSchedules.push(schedule);
      }
    }
  }

  // Calculate actual times for each filtered schedule and filter those within range
  const result = filteredSchedules
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
          const currentDayOfWeek = (dt.weekday + 1) % 7; // Luxon uses 1-7 for Monday-Sunday, convert it to 1-7 for Sunday-Saturday

          let daysDiff = schedule.weeklyDetermineByDay - currentDayOfWeek;

          // Adjust the date to the previous occurrence of the target day
          dateForDayTimes = dt.plus({ days: daysDiff }).toJSDate();
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
