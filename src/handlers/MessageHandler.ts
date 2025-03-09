import { u } from "@upstash/redis/zmscore-C3G81zLz";
import { KVClient } from "../clients/KVClient";
import { WhatsappClient } from "../clients/WhatsappClient";
import { getHookStep, getInitialStep, getStep } from "../conversation";
import { User } from "../datasource/entities/User";
import { getMinyanByName } from "../datasource/minyansRepository";
import {
  assignUserToAMinyan,
  getUserByPhone,
  saveUser,
} from "../datasource/usersRepository";
import { WebhookObject } from "../external/whatsapp/types/webhooks";
import { extractTextFromMessage } from "../utils";
import { HandlerRequest, HandlerResponse, IHandler } from "./types";
import { UnexpectedUserInputError } from "../errors";
import {
  sendSystemMessage,
  SystemMessages,
} from "../conversation/systemMessages";

export class MessageHandler implements IHandler {
  async handle(req: HandlerRequest): Promise<HandlerResponse> {
    console.log("incoming message request", JSON.stringify(req.body));

    /**
     * Message handling flow:
     *
     * Extract incoming message
     * Get User step from KV
     * ? State exists
     *  - getNextStep(input)
     *  ? Next step exists
     *    - execute action
     *    - save next step id to KV
     *  ? Next step does not exist
     *    - check for hook by input
     *    ? hook exists
     *     - initiate flow with hook job
     *    ? hook does not exist
     *     - send error message (keep current step)
     * ? State does not exist
     *  - initiate flow with initial step
     */

    const waMessage = req.body as WebhookObject;
    const message = extractTextFromMessage(waMessage);
    if (!message) {
      // non supported message (video, status, etc)- currently not interested in handling
      return;
    }

    const recipientPhoneNum = message.recipient.phoneNum;

    const kvClient = new KVClient(
      process.env.KV_REST_API_TOKEN!,
      process.env.KV_REST_API_URL!
    );

    const waClient = new WhatsappClient(Number(process.env.WA_PHONE_NUMBER_ID));

    const userContext = await kvClient.get(message.recipient.phoneNum);

    try {
      if (userContext?.currentStepId) {
        const lastStep = getStep(userContext.currentStepId);
        if (!lastStep) {
          throw new Error(
            `current step not found ${userContext.currentStepId}`
          );
        }
        if (userContext.retry) {
          await lastStep.action(+recipientPhoneNum, waClient, message.message!);
          userContext.retry = false;
          await kvClient.set(message.recipient.phoneNum, userContext);
          return;
        }
        const nextStepId = lastStep.getNextStepId(
          message.message!,
          userContext.context
        );
        if (!nextStepId) {
          console.log("next step not found - final step");
          await kvClient.del(message.recipient.phoneNum);
          return;
        }
        const step = getStep(nextStepId);
        if (!step) {
          throw new Error(`next step not found ${nextStepId}`); //unexpected error
        }
        await step.action(+recipientPhoneNum, waClient, message.message!);
        userContext.currentStepId = nextStepId;
        await kvClient.set(message.recipient.phoneNum, userContext);

        return { status: "Message received" };
      } else {
        const initialStep = getInitialStep();
        await initialStep.action(
          +recipientPhoneNum,
          waClient,
          message.message!
        );
        const newUserContext = { currentStepId: initialStep.id };
        await kvClient.set(message.recipient.phoneNum, newUserContext);
      }
    } catch (e) {
      if (e instanceof UnexpectedUserInputError) {
        console.log("unexpected user input, falling back to hooks", e);
        const hookStep = getHookStep(message.message!);
        if (hookStep) {
          await hookStep.action(+recipientPhoneNum, waClient, message.message!);
          const newUserContext = {
            ...userContext,
            currentStepId: hookStep.id,
          };
          await kvClient.set(message.recipient.phoneNum, newUserContext);
        } else {
          const newUserContext = {
            ...userContext,
            retry: true,
          };
          await kvClient.set(message.recipient.phoneNum, newUserContext);
          await sendSystemMessage(
            +recipientPhoneNum,
            waClient,
            SystemMessages.UNEXPECTED_USER_INPUT
          );
        }
      } else {
        console.log("unexpected error occurred, resetting user state", e);
        await kvClient.del(message.recipient.phoneNum);
      }
    }

    // const nameFromKv = await kvClient.get(message.recipient.phoneNum);
    // console.log("name from kv", nameFromKv);

    // const waClient = new WhatsappClient(
    //   Number(process.env.WA_PHONE_NUMBER_ID)
    // );

    // try {
    //   let user = await getUserByPhone(message.recipient.phoneNum);
    //   if (!user) {
    //     user = new User();
    //     user.name = message.recipient.name;
    //     user.phone = message.recipient.phoneNum;
    //     user = await saveUser(user);
    //   }

    //   const minyan = await getMinyanByName("איצקוביץ ברוכין");
    //   assignUserToAMinyan(user.id, minyan!.id);
    //   console.log("user saved", user);
    // } catch (e) {
    //   console.log(e);
    // }

    // const recipientPhoneNum = message.recipient.phoneNum;
    // const resp = await waClient.sendTextMessage(
    //   +recipientPhoneNum,
    //   `התקבל ${new Date().toLocaleString()}
    //   מאת: ${nameFromKv?.name}`
    // );

    //   const step = getStep();
    //   await step.action(+recipientPhoneNum, waClient, message.message!);
    // } catch (e) {
    //   console.log(req.body);
  }
}
