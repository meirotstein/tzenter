import { DateTime } from "luxon";
import { ScheduleContext } from "./conversation/types";
import { Prayer } from "./datasource/entities/Schedule";
import {
  BadInputError,
  InvalidInputError,
  UnauthorizedMessageError,
} from "./errors";
import { WebhookObject } from "./external/whatsapp/types/webhooks";
import { WAMessageType, WATextMessage } from "./handlers/types";
import { getJewishEventsOnDateWrapper } from "./external/hebcal/getJewishEventsOnDateWrapper";
import { flags } from "@hebcal/core";

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

  switch (waMsg.type) {
    case "text":
      msgType = WAMessageType.TEXT;
      msgText = waMsg.text?.body;
      break;
    case "button":
      msgType = WAMessageType.TEMPLATE;
      msgText = waMsg.button?.text;
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
  };
}

export function prayerHebName(prayer: Prayer): string {
  switch (prayer) {
    case Prayer.Shacharit:
      return "שחרית";
    case Prayer.Mincha:
      return "מנחה";
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

export async function shouldSkipScheduleToday(date: Date): Promise<boolean> {
  const holidaysToday = await getJewishEventsOnDateWrapper(date);
  if (holidaysToday?.length) {
    for (const holiday of holidaysToday) {
      const flagsBitmask = holiday.mask;
      const isChag = (flagsBitmask & flags.CHAG) === flags.CHAG;
      const isErevChag = (flagsBitmask & flags.EREV) === flags.EREV;
      const isMinorChag =
        (flagsBitmask & flags.MINOR_HOLIDAY) === flags.MINOR_HOLIDAY;

      return (isChag || isErevChag) && !isMinorChag;
    }
  }
  return false;
}
