import { DateTime } from "luxon";
import { Schedule } from "../datasource/entities/Schedule";
import { getSchedulesByMinyanId } from "../datasource/scheduleRepository";
import { shouldSkipSchedule } from "../utils";
import {
  DayTimes,
  calculateDayTimes,
  calculateScheduleTime,
  isScheduleRelevantForDate,
} from "./scheduleTimeUtils";

export interface NextMinyanSchedule {
  schedule: Schedule;
  calculatedTime: DateTime;
}

function getDayTimesForSchedule(
  schedule: Schedule,
  referenceDate: Date,
  timezone: string
): DayTimes | undefined {
  let dayTimes: DayTimes | undefined;

  if (schedule.relative && schedule.minyan.latitude && schedule.minyan.longitude) {
    let dateForDayTimes = referenceDate;

    if (schedule.weeklyDetermineByDay) {
      const dt = DateTime.fromJSDate(referenceDate);
      const currentDayOfWeek = (dt.weekday + 1) % 7;
      const daysDiff = schedule.weeklyDetermineByDay - currentDayOfWeek;
      dateForDayTimes = dt.plus({ days: daysDiff }).toJSDate();
    }

    dayTimes = calculateDayTimes(
      dateForDayTimes,
      schedule.minyan.latitude,
      schedule.minyan.longitude,
      timezone
    );
  }

  return dayTimes;
}

export async function getNextMinyanSchedule(
  minyanId: number,
  from: Date = new Date(),
  timezone: string = "Asia/Jerusalem",
  lookAheadDays: number = 30
): Promise<NextMinyanSchedule | undefined> {
  const schedules = (await getSchedulesByMinyanId(minyanId)).filter(
    (schedule) => schedule.enabled !== false
  );
  const now = DateTime.fromJSDate(from).setZone(timezone);

  let nextSchedule: NextMinyanSchedule | undefined;

  for (let dayOffset = 0; dayOffset <= lookAheadDays; dayOffset += 1) {
    const referenceDate = now.plus({ days: dayOffset }).toJSDate();

    for (const schedule of schedules) {
      if (!isScheduleRelevantForDate(schedule, referenceDate)) {
        continue;
      }

      if (await shouldSkipSchedule(schedule, referenceDate)) {
        continue;
      }

      const dayTimes = getDayTimesForSchedule(schedule, referenceDate, timezone);
      const calculatedTime = calculateScheduleTime(
        schedule,
        timezone,
        dayTimes,
        referenceDate
      );

      if (calculatedTime <= now) {
        continue;
      }

      if (!nextSchedule || calculatedTime < nextSchedule.calculatedTime) {
        nextSchedule = { schedule, calculatedTime };
      }
    }

    if (nextSchedule) {
      break;
    }
  }

  if (!nextSchedule) {
    return undefined;
  }
  return nextSchedule;
}
