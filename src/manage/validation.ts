import { InvalidInputError } from "../errors";
import {
  Prayer,
  RelativeTime,
  Schedule,
  WeekDay,
} from "../datasource/entities/Schedule";
import { Minyan } from "../datasource/entities/Minyan";

type RawBody = Record<string, any>;

function parseOptionalTrimmedString(value: any): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  const parsed = String(value).trim();
  return parsed.length ? parsed : undefined;
}

function parseRequiredTrimmedString(value: any, fieldName: string): string {
  const parsed = parseOptionalTrimmedString(value);
  if (!parsed) {
    throw new InvalidInputError(`${fieldName} is required`);
  }
  return parsed;
}

function parseOptionalNumber(value: any, fieldName: string): number | null | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (value === null || value === "") {
    return null;
  }

  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    throw new InvalidInputError(`${fieldName} must be a number`);
  }
  return parsed;
}

function parseOptionalInteger(value: any, fieldName: string): number | null | undefined {
  const parsed = parseOptionalNumber(value, fieldName);
  if (parsed === undefined || parsed === null) {
    return parsed;
  }
  if (!Number.isInteger(parsed)) {
    throw new InvalidInputError(`${fieldName} must be an integer`);
  }
  return parsed;
}

function parseBoolean(value: any): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  const normalized = String(value).toLowerCase();
  return ["true", "1", "on", "yes"].includes(normalized);
}

function parseOptionalDate(value: any, fieldName: string): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (value === null || value === "") {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new InvalidInputError(`${fieldName} must be a valid date`);
  }

  return String(value);
}

function parseWeekDays(value: any): WeekDay[] | null | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (value === null || value === "") {
    return null;
  }

  const values = Array.isArray(value) ? value : [value];
  const parsed = values.map((item) => Number(item));

  parsed.forEach((day) => {
    if (!Object.values(WeekDay).includes(day)) {
      throw new InvalidInputError("weekDays contains an invalid weekday");
    }
  });

  return parsed as WeekDay[];
}

export function parseMinyanUpdateInput(body: RawBody): Partial<Minyan> {
  const payload: Partial<Minyan> = {};

  if (body.name !== undefined) {
    payload.name = parseRequiredTrimmedString(body.name, "name");
  }

  if (body.city !== undefined) {
    payload.city = parseRequiredTrimmedString(body.city, "city");
  }

  if (body.latitude !== undefined) {
    payload.latitude = parseOptionalNumber(body.latitude, "latitude") as any;
  }

  if (body.longitude !== undefined) {
    payload.longitude = parseOptionalNumber(body.longitude, "longitude") as any;
  }

  return payload;
}

export function parseScheduleInput(
  body: RawBody,
  minyan: Minyan,
  { requireAllFields }: { requireAllFields: boolean }
): Partial<Schedule> {
  const payload: Partial<Schedule> = {};

  if (requireAllFields || body.name !== undefined) {
    payload.name = parseRequiredTrimmedString(body.name, "name");
  }

  if (requireAllFields || body.prayer !== undefined) {
    const prayer = Number(body.prayer);
    if (!Object.values(Prayer).includes(prayer)) {
      throw new InvalidInputError("prayer is invalid");
    }
    payload.prayer = prayer as Prayer;
  }

  if (requireAllFields || body.time !== undefined) {
    const time = parseRequiredTrimmedString(body.time, "time");
    if (!/^\d{2}:\d{2}(:\d{2})?$/.test(time)) {
      throw new InvalidInputError("time must be in HH:mm or HH:mm:ss format");
    }
    payload.time = time.length === 5 ? `${time}:00` : time;
  }

  if (requireAllFields || body.enabled !== undefined) {
    payload.enabled = body.enabled === undefined ? false : parseBoolean(body.enabled);
  }

  if (body.relative !== undefined) {
    if (body.relative === "") {
      payload.relative = null as any;
    } else {
      const relative = String(body.relative);
      if (!Object.values(RelativeTime).includes(relative as RelativeTime)) {
        throw new InvalidInputError("relative is invalid");
      }
      if (minyan.latitude == null || minyan.longitude == null) {
        throw new InvalidInputError(
          "relative schedules require minyan latitude and longitude"
        );
      }
      payload.relative = relative as RelativeTime;
    }
  }

  if (body.weeklyDetermineByDay !== undefined) {
    const weeklyDetermineByDay = parseOptionalInteger(
      body.weeklyDetermineByDay,
      "weeklyDetermineByDay"
    );
    if (
      weeklyDetermineByDay !== null &&
      weeklyDetermineByDay !== undefined &&
      !Object.values(WeekDay).includes(weeklyDetermineByDay)
    ) {
      throw new InvalidInputError("weeklyDetermineByDay is invalid");
    }
    payload.weeklyDetermineByDay =
      weeklyDetermineByDay === null
        ? (null as any)
        : (weeklyDetermineByDay as WeekDay);
  }

  if (requireAllFields || body.roundToNearestFiveMinutes !== undefined) {
    payload.roundToNearestFiveMinutes =
      body.roundToNearestFiveMinutes === undefined
        ? false
        : parseBoolean(body.roundToNearestFiveMinutes);
  }

  if (body.startAt !== undefined) {
    payload.startAt = parseOptionalDate(body.startAt, "startAt") as any;
  }

  if (body.endAt !== undefined) {
    payload.endAt = parseOptionalDate(body.endAt, "endAt") as any;
  }

  if (body.weekDays !== undefined) {
    const weekDays = parseWeekDays(body.weekDays);
    payload.weekDays = weekDays === null ? (null as any) : weekDays;
  }

  if (body.config !== undefined) {
    payload.config = parseOptionalInteger(body.config, "config") as any;
  }

  if (payload.startAt && payload.endAt) {
    const start = new Date(payload.startAt);
    const end = new Date(payload.endAt);
    if (start > end) {
      throw new InvalidInputError("startAt must be before endAt");
    }
  }

  return payload;
}
