import { KVClient } from "../clients/KVClient";
import { WhatsappClient } from "../clients/WhatsappClient";
import { User } from "../datasource/entities/User";
import { getMinyanByName } from "../datasource/minyansRepository";
import {
  assignUserToAMinyan,
  getUserByPhone,
  saveUser,
} from "../datasource/usersRepository";
import { WebhookObject } from "../external/whatsapp/types/webhooks";
import { extractTextMessage } from "../utils";
import { HandlerRequest, HandlerResponse, IHandler } from "./types";

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

      const kvClient = new KVClient(
        process.env.KV_REST_API_TOKEN!,
        process.env.KV_REST_API_URL!
      );
      await kvClient.set(message.recipient.phoneNum, {
        name: message.recipient.name,
      });

      const nameFromKv = await kvClient.get(message.recipient.phoneNum);
      console.log("name from kv", nameFromKv);

      const waClient = new WhatsappClient(
        Number(process.env.WA_PHONE_NUMBER_ID)
      );

      try {
        let user = await getUserByPhone(message.recipient.phoneNum);
        if (!user) {
          user = new User();
          user.name = message.recipient.name;
          user.phone = message.recipient.phoneNum;
          user = await saveUser(user);
        }

        const minyan = await getMinyanByName("איצקוביץ ברוכין");
        assignUserToAMinyan(user.id, minyan!.id);
        console.log("user saved", user);
      } catch (e) {
        console.log(e);
      }

      const recipientPhoneNum = message.recipient.phoneNum;
      const resp = await waClient.sendTextMessage(
        +recipientPhoneNum,
        `התקבל ${new Date().toLocaleString()}
        מאת: ${nameFromKv?.name}`
      );
      console.log("response from whatsapp", resp);
    } catch (e) {
      console.log(req.body);
    }

    return { status: "Message received" };
  }
}
