import { WhatsappClient } from "../../clients/WhatsappClient";
import { assignUserToAMinyan } from "../../datasource/usersRepository";
import { Context } from "../context";
import { Step, UserContext } from "../types";

export const registerMinyanStep: Step = {
  id: "registerMinyanStep",
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

    await assignUserToAMinyan(userContext!.userId, userContext!.minyanId);

    let responseText = "ההרשמה למניין בוצעה בהצלחה";
    responseText += "\n\n";
    responseText += "מעכשיו, אני אעדכן אותך לגבי תפילות שמתקיימות ושינויים שנוגעים למניין זה.";

    await waClient.sendTextMessage(userNum, responseText);
    await context.delete();
  },
  getNextStepId: async (userText: string, context: Context<UserContext>) =>
    Promise.resolve(undefined),
};
