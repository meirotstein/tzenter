import { HandlerRequest, HandlerResponse, IHandler } from "./types";
import { WebhookObject } from "../external/whatsapp/types/webhooks";
import { WhatsappClient } from '../clients/WhatsappClient';
import { extractTextMessage } from "../utils";

export class MessageHandler implements IHandler {
  
  async handle(req: HandlerRequest): Promise<HandlerResponse> {
    console.log("incoming message request", JSON.stringify(req.body));

    try {
      const waMessage = req.body as WebhookObject;
      const message = extractTextMessage(waMessage);
      if (!message) {
        // non-text message (video, status, etc)- currently not interested in handling
        return;
      }
      const waClient = new WhatsappClient(Number(process.env.WA_PHONE_NUMBER_ID));
      const recipientPhoneNum = message.recipient.phoneNum;
      const resp = await waClient.sendTextMessage(+recipientPhoneNum, `התקבל ${new Date().toLocaleString()}`);
      console.log("response from whatsapp", resp);
    } catch (e) {
      console.log(req.body);
    }

    return { status: "Message received" };
  }
}
