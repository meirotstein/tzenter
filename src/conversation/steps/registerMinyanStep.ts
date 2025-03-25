import { WhatsappClient } from "../../clients/WhatsappClient";
import { assignUserToAMinyan } from "../../datasource/usersRepository";
import { Context } from "../context";
import { Step } from "../types";

export const registerMinyanStep: Step = {
  id: "registerMinyanStep",
  action: async (
    userNum: number,
    waClient: WhatsappClient,
    userText: string,
    context: Context
  ) => {
    const userContext = (await context.getUserContext())?.context;
    if (isNaN(userContext?.userId) || isNaN(userContext?.minyanId)) {
      throw new Error("userId/minyanId is not defined in context");
    }

    await assignUserToAMinyan(userContext!.userId, userContext!.minyanId);

    let responseText = "ההרשמה שלך למניין בוצעה בהצלחה";

    await waClient.sendTextMessage(userNum, responseText);
    await context.deleteUserContext();
  },
  getNextStepId: async (userText: string, context: Context) =>
    Promise.resolve(undefined),
};
