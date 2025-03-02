import { HandlerRequest, HandlerResponse, IHandler } from "../types/handlerTypes";
import { WebhookObject } from "../types/whatsapp/types/webhooks";
import { WhatsappClient } from '../clients/WhatsappClient';
import { extractMessage } from "../utils";

export class MessageHandler implements IHandler {
  
  async handle(req: HandlerRequest): Promise<HandlerResponse> {
    console.log("incoming message request", JSON.stringify(req.query));

    try {
      const waMessage = req.body as WebhookObject;
      const message = extractMessage(waMessage);
      if (!message) {
        console.error("Cannot extract message from webhook object", waMessage);
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
