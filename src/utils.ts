import { Prayer } from "./datasource/entities/Schedule";
import {
  BadInputError,
  InvalidInputError,
  UnauthorizedMessageError,
} from "./errors";
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
