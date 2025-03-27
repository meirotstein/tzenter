import { WhatsappClient } from "../../clients/WhatsappClient";
import { removeUserFromMinyan } from "../../datasource/usersRepository";
import { Context } from "../context";
import { Step, UserContext } from "../types";

export const unregisterMinyanStep: Step = {
  id: "unregisterMinyanStep",
  action: async (
    userNum: number,
    waClient: WhatsappClient,
    userText: string,
    context: Context<UserContext>
  ) => {
    const userContext = (await context.get())?.context;
    if (isNaN(userContext?.userId) || isNaN(userContext?.minyanId)) {
      throw new Error("userId/minyanId is not defined in context");
    }

    await removeUserFromMinyan(userContext!.userId, userContext!.minyanId);

    let responseText = "ההרשמה למניין הוסרה בהצלחה";

    await waClient.sendTextMessage(userNum, responseText);
    await context.delete();
  },
  getNextStepId: async (userText: string, context: Context<UserContext>) =>
    Promise.resolve(undefined),
};
