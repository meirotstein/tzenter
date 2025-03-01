import { HandlerRequest, HandlerResponse, IHandler } from "../types/handlerTypes";
import { WebhookObject } from "../types/whatsapp/types/webhooks";
import { WhatsappClient } from '../clients/WhatsappClient';

export class MessageHandler implements IHandler {
  async handle(req: HandlerRequest): Promise<HandlerResponse> {
    console.log("incoming message request", req.query);

    try {
      const message = req.body as WebhookObject;
      const waClient = new WhatsappClient(581926268335637);
      const recipientPhoneNum = message.entry[0].changes[0].value.contacts[0].wa_id;
      const resp = await waClient.sendTextMessage(+recipientPhoneNum, `התקבל ${new Date().toLocaleString()}`);
      console.log("response from whatsapp", resp);
    } catch (e) {
      console.log(req.body);
    }

    return { status: "Message received" };
  }
}
