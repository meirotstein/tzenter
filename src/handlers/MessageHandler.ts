import { KVClient } from "../clients/KVClient";
import { WhatsappClient } from "../clients/WhatsappClient";
import { getHookStep, getInitialStep, getStep } from "../conversation";
import {
  sendSystemMessage,
  SystemMessages,
} from "../conversation/systemMessages";
import { Step } from "../conversation/types";
import { UnexpectedUserInputError } from "../errors";
import { WebhookObject } from "../external/whatsapp/types/webhooks";
import { extractTextFromMessage } from "../utils";
import {
  HandlerRequest,
  HandlerResponse,
  IHandler,
  UserContext,
  WATextMessage,
} from "./types";

export class MessageHandler implements IHandler {
  private kvClient: KVClient;
  private waClient: WhatsappClient;

  constructor() {
    this.kvClient = new KVClient(
      process.env.KV_REST_API_TOKEN!,
      process.env.KV_REST_API_URL!
    );

    this.waClient = new WhatsappClient(Number(process.env.WA_PHONE_NUMBER_ID));
  }

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

    const userContext = await this.kvClient.get(message.recipient.phoneNum);

    try {
      if (!userContext?.currentStepId) {
        return await this.initialMessage(+recipientPhoneNum, message);
      }

      const lastStep = getStep(userContext.currentStepId);

      if (!lastStep) {
        throw new Error(`current step not found ${userContext.currentStepId}`);
      }

      if (userContext.retry) {
        return await this.retryMessage(
          lastStep,
          userContext,
          +recipientPhoneNum,
          message
        );
      }

      return this.nextMessage(
        lastStep,
        userContext,
        +recipientPhoneNum,
        message
      );
    } catch (e) {
      if (e instanceof UnexpectedUserInputError) {
        console.log("unexpected user input", e);
        const hookStatus = await this.hookMessage(
          userContext,
          +recipientPhoneNum,
          message
        );
        if (hookStatus) {
          return hookStatus;
        }

        return await this.systemMessage(
          userContext,
          +recipientPhoneNum,
          message
        );
      } else {
        console.log("unexpected error occurred, resetting user state", e);
        await this.kvClient.del(message.recipient.phoneNum);
      }
    }
  }

  async initialMessage(phoneNum: number, message: WATextMessage) {
    const initialStep = getInitialStep();
    await initialStep.action(phoneNum, this.waClient, message.message!);
    const newUserContext = { currentStepId: initialStep.id };
    await this.kvClient.set(message.recipient.phoneNum, newUserContext);
    return { status: "Message received - initial" };
  }

  async retryMessage(
    step: Step,
    userContext: UserContext,
    phoneNum: number,
    message: WATextMessage
  ) {
    await step.action(phoneNum, this.waClient, message.message!);
    userContext.retry = false;
    await this.kvClient.set(message.recipient.phoneNum, userContext);
    return { status: "Message retried" };
  }

  async nextMessage(
    step: Step,
    userContext: UserContext,
    phoneNum: number,
    message: WATextMessage
  ) {
    const nextStepId = step.getNextStepId(
      message.message!,
      userContext.context
    );
    if (!nextStepId) {
      console.log("next step not found - final step");
      await this.kvClient.del(message.recipient.phoneNum);
      return;
    }
    const nextStep = getStep(nextStepId);
    if (!nextStep) {
      throw new Error(`next step not found ${nextStepId}`); //unexpected error
    }
    await nextStep.action(phoneNum, this.waClient, message.message!);
    userContext.currentStepId = nextStepId;
    await this.kvClient.set(message.recipient.phoneNum, userContext);

    return { status: "Message received" };
  }

  async hookMessage(
    userContext: UserContext | null,
    phoneNum: number,
    message: WATextMessage
  ) {
    const hookStep = getHookStep(message.message!);
    if (hookStep) {
      console.log("hook step found", hookStep.id);
      await hookStep.action(phoneNum, this.waClient, message.message!);
      const newUserContext = {
        ...(userContext || {}),
        currentStepId: hookStep.id,
      };
      await this.kvClient.set(message.recipient.phoneNum, newUserContext);
      return { status: "Message received" };
    }
  }

  async systemMessage(
    userContext: UserContext | null,
    phoneNum: number,
    message: WATextMessage
  ) {
    const newUserContext = {
      ...(userContext || {}),
      retry: true,
    };
    await this.kvClient.set(message.recipient.phoneNum, newUserContext);
    await sendSystemMessage(
      phoneNum,
      this.waClient,
      SystemMessages.UNEXPECTED_USER_INPUT
    );
    return { status: "Message received" };
  }
}
