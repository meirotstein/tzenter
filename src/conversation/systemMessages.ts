import { WhatsappClient } from "../clients/WhatsappClient";

export const enum SystemMessages {
  UNEXPECTED_USER_INPUT = "unexpected_user_input",
}

const systemMessages = {
  [SystemMessages.UNEXPECTED_USER_INPUT]:
    "אני מתנצל, לא הבנתי את התשובה, בבקשה נסה שנית או כתוב צענטר כדי להתחיל מחדש",
};

export async function sendSystemMessage(
  userNum: number,
  waClient: WhatsappClient,
  messageId: SystemMessages
): Promise<void> {
  await waClient.sendTextMessage(
    userNum,
    systemMessages[messageId] || messageId
  );
}
