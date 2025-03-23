import { WhatsappClient } from "../clients/WhatsappClient";
import { getHookStep, getInitialStep, getStep } from "../conversation";
import { Context } from "../conversation/context";
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
  WATextMessage,
} from "./types";

export class MessageHandler implements IHandler {
  private waClient: WhatsappClient;

  constructor() {
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

    const context = new Context(recipientPhoneNum);

    try {
      const userContext = await context.getUserContext();

      if (!userContext?.currentStepId) {
        return await this.initialMessage(+recipientPhoneNum, message, context);
      }

      const lastStep = getStep(userContext.currentStepId);

      if (!lastStep) {
        throw new Error(`current step not found ${userContext.currentStepId}`);
      }

      const nextResponse = await this.nextMessage(
        lastStep,
        context,
        +recipientPhoneNum,
        message
      );

      if (nextResponse) {
        return nextResponse;
      }

      const hookStatus = await this.hookMessage(
        context,
        +recipientPhoneNum,
        message
      );
      if (hookStatus) {
        return hookStatus;
      }
    } catch (e) {
      if (e instanceof UnexpectedUserInputError) {
        console.log("unexpected user input", e);
        const hookStatus = await this.hookMessage(
          context,
          +recipientPhoneNum,
          message
        );
        if (hookStatus) {
          return hookStatus;
        }

        return await this.systemMessageUnexpected(+recipientPhoneNum);
      } else {
        console.log("unexpected error occurred, resetting user state", e);
        await context.deleteUserContext();
      }
    }
  }

  async initialMessage(
    phoneNum: number,
    message: WATextMessage,
    context: Context
  ) {
    const initialStep = getInitialStep();
    await initialStep.action(
      phoneNum,
      this.waClient,
      message.message!,
      context
    );
    const newUserContext = { currentStepId: initialStep.id };
    await context.setUserContext(newUserContext);
    return { status: "Message received - initial" };
  }

  async nextMessage(
    step: Step,
    context: Context,
    phoneNum: number,
    message: WATextMessage
  ) {
    const nextStepId = step.getNextStepId(message.message!, context);
    if (!nextStepId) {
      console.log("next step not found - final step");
      await context.deleteUserContext();
      return;
    }
    const nextStep = getStep(nextStepId);
    if (!nextStep) {
      throw new Error(`next step not found ${nextStepId}`); //unexpected error
    }
    await nextStep.action(phoneNum, this.waClient, message.message!, context);
    await context.updateUserContext({ currentStepId: nextStepId });

    return { status: "Message received" };
  }

  async hookMessage(
    context: Context,
    phoneNum: number,
    message: WATextMessage
  ) {
    const hookStep = getHookStep(message.message!);
    if (hookStep) {
      console.log("hook step found", hookStep.id);
      await hookStep.action(phoneNum, this.waClient, message.message!, context);
      await context.updateUserContext({ currentStepId: hookStep.id });
      return { status: "Message received" };
    }
  }

  async systemMessageUnexpected(phoneNum: number) {
    await sendSystemMessage(
      phoneNum,
      this.waClient,
      SystemMessages.UNEXPECTED_USER_INPUT
    );
    return { status: "Message received" };
  }
}
