import { WhatsappClient } from "../../clients/WhatsappClient";
import { removeUserFromMinyan } from "../../datasource/usersRepository";
import { WATextMessage } from "../../handlers/types";
import { Context } from "../context";
import { messages } from "../messageTemplates";
import { Step, UserContext } from "../types";

export const unregisterMinyanStep: Step = {
  id: "unregisterMinyanStep",
  action: async (
    userNum: number,
    waClient: WhatsappClient,
    message: WATextMessage,
    context: Context<UserContext>
  ) => {
    const userContext = (await context.get())?.context;
    if (isNaN(userContext?.userId) || isNaN(userContext?.minyanId)) {
      throw new Error("userId/minyanId is not defined in context");
    }

    await removeUserFromMinyan(userContext!.userId, userContext!.minyanId);

    await waClient.sendTextMessage(userNum, messages.UNREGISTER_MINYAN_SUCCESS);
    await context.delete();
  },
  getNextStepId: async (userText: string, context: Context<UserContext>) =>
    Promise.resolve(undefined),
};
