import { DateTime } from "luxon";
import { DailyEvents } from "../types";
import { ScheduleContext } from "./conversation/types";
import { Prayer, Schedule } from "./datasource/entities/Schedule";
import { ScheduleConfig } from "./datasource/entities/ScheduleConfig";
import {
  BadInputError,
  InvalidInputError,
  UnauthorizedMessageError,
} from "./errors";
import { flags } from "./external/hebcal/flags";
import { getJewishEventsOnDateWrapper } from "./external/hebcal/getJewishEventsOnDateWrapper";
import { WebhookObject } from "./external/whatsapp/types/webhooks";
import { WAMessageType, WATextMessage } from "./handlers/types";

export function errorToHttpStatusCode(error: Error) {
  if (error instanceof BadInputError) {
    return 400;
  }
  if (error instanceof InvalidInputError) {
    return 422;
  }
  if (error instanceof UnauthorizedMessageError) {
    return 401;
  }
  return 500;
}

export function extractTextFromMessage(
  message: WebhookObject
): WATextMessage | undefined {
  if (
    !message?.entry[0]?.changes[0]?.value?.messages ||
    !message?.entry[0]?.changes[0]?.value?.contacts
  ) {
    return;
  }

  const waMsg = message.entry[0].changes[0].value.messages[0];

  if (!waMsg?.type) {
    return;
  }

  let msgType: WAMessageType;
  let msgText: string | undefined;
  let msgPayload: string | undefined;

  switch (waMsg.type) {
    case "text":
      msgType = WAMessageType.TEXT;
      msgText = waMsg.text?.body;
      break;
    case "button":
      msgType = WAMessageType.TEMPLATE;
      msgText = waMsg.button?.text;
      msgPayload = waMsg.button?.payload;
      break;
    default:
      console.log(`Unsupported message type: ${waMsg.type}`);
      return;
  }

  return {
    type: msgType,
    id: message.entry[0].changes[0].value.messages[0]?.id,
    recipient: {
      phoneNum: message.entry[0].changes[0].value.contacts[0].wa_id,
      name: message.entry[0].changes[0].value.contacts[0].profile.name,
    },
    timestamp: message.entry[0].changes[0].value.messages[0]?.timestamp,
    message: msgText,
    payload: msgPayload,
  };
}

export function prayerHebName(prayer: Prayer): string {
  switch (prayer) {
    case Prayer.Shacharit:
      return "שחרית";
    case Prayer.Mincha:
      return "מנחה";
    case Prayer.Slichot:
      return "סליחות";
    default:
      return "ערבית";
  }
}

export function isAtLeastMinApart(
  a: number | Date,
  b: number | Date,
  intervalMinutes: number
): boolean {
  const ts1 = DateTime.fromJSDate(new Date(a), { zone: "Asia/Jerusalem" });
  const ts2 = DateTime.fromJSDate(new Date(b), { zone: "Asia/Jerusalem" });

  const diff = Math.abs(ts1.diff(ts2, "minutes").minutes);
  return diff >= intervalMinutes;
}

export function calculatedAttendees(scheduleContext: ScheduleContext): number {
  const approved = scheduleContext.approved || {};
  return Object.values(approved).reduce((acc, curr) => acc + curr, 0);
}

export function isLastExecution(
  scheduleHourStr: string,
  executionIntervalMin: number,
  zone = "Asia/Jerusalem"
): boolean {
  try {
    const now = DateTime.now().setZone(zone);

    const [hour, minute, second] = scheduleHourStr.split(":").map(Number);

    const todayAtGivenTime = now.set({ hour, minute, second: second || 0 });

    const diff = now.diff(todayAtGivenTime, "minutes").minutes;

    if (diff > 0) {
      return false;
    }

    return Math.abs(diff) < executionIntervalMin;
  } catch (error) {
    console.error("Error in isLastExecution:", error);
    return false;
  }
}

export async function shouldSkipSchedule(
  schedule: Schedule,
  date: Date
): Promise<boolean> {
  const eventsToday = await getJewishEventsOnDateWrapper(date);
  if (eventsToday?.length) {
    for (const event of eventsToday) {
      const flagsBitmask = event.mask;
      const isChag = (flagsBitmask & flags.CHAG) === flags.CHAG;
      const isErevChag = (flagsBitmask & flags.EREV) === flags.EREV;
      const isMinorChag =
        (flagsBitmask & flags.MINOR_HOLIDAY) === flags.MINOR_HOLIDAY;

      console.log("Events today", {
        isChag,
        isErevChag,
        isMinorChag,
        eventsToday,
        scheduleConfig: schedule.config,
      });

      // Check if this is a major holiday (chag or erev chag) and not a minor holiday
      const isMajorHoliday = (isChag || isErevChag) && !isMinorChag;

      if (isMajorHoliday) {
        // If it's a major holiday, check schedule configuration
        const shouldRunOnHoliday = ScheduleConfig.shouldRunOnHoliday(
          schedule.config
        );
        const shouldRunOnHolidayEve = ScheduleConfig.shouldRunOnHolidayEve(
          schedule.config
        );

        // Skip if it's a holiday and schedule is not configured to run on holidays
        if (isChag && !shouldRunOnHoliday) {
          return true;
        }

        // Skip if it's a holiday eve and schedule is not configured to run on holiday eves
        if (isErevChag && !shouldRunOnHolidayEve) {
          return true;
        }
      }
    }
  }
  return false;
}

// Keep the old function for backward compatibility, but mark as deprecated
/** @deprecated Use shouldSkipSchedule(schedule, date) instead */
export async function shouldSkipScheduleToday(date: Date): Promise<boolean> {
  // For backward compatibility, we'll assume no schedule config (skip on holidays)
  // This maintains the old behavior
  const eventsToday = await getJewishEventsOnDateWrapper(date);
  if (eventsToday?.length) {
    for (const event of eventsToday) {
      const flagsBitmask = event.mask;
      const isChag = (flagsBitmask & flags.CHAG) === flags.CHAG;
      const isErevChag = (flagsBitmask & flags.EREV) === flags.EREV;
      const isMinorChag =
        (flagsBitmask & flags.MINOR_HOLIDAY) === flags.MINOR_HOLIDAY;

      return (isChag || isErevChag) && !isMinorChag;
    }
  }
  return false;
}

export async function getDailyEvents(date: Date): Promise<DailyEvents> {
  const eventsToday = await getJewishEventsOnDateWrapper(date);
  const events: DailyEvents = { date };
  for (const event of eventsToday || []) {
    if ((event as any)["omer"]) {
      events.omerCount = (event as any)["omer"];
    }
  }
  return events;
}
