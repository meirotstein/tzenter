import { BadInputError, InvalidInputError } from "./errors";
import { WATextMessage } from "./handlers/types";
import { WebhookObject } from "./external/whatsapp/types/webhooks";

export function errorToHttpStatusCode(error: Error) {
  if (error instanceof BadInputError) {
    return 400;
  }
  if (error instanceof InvalidInputError) {
    return 422;
  }
  return 500;
}

export function extractTextMessage(message: WebhookObject): WATextMessage | undefined {
  if (
    !message?.entry[0]?.changes[0]?.value?.messages ||
    !message?.entry[0]?.changes[0]?.value?.contacts
  ) {
    return;
  }
  return {
    id: message.entry[0].changes[0].value.messages[0]?.id,
    recipient: {
      phoneNum: message.entry[0].changes[0].value.contacts[0].wa_id,
      name: message.entry[0].changes[0].value.contacts[0].profile.name,
    },
    timestamp: message.entry[0].changes[0].value.messages[0]?.timestamp,
    message: message.entry[0].changes[0].value.messages[0]?.text?.body,
  };
}
