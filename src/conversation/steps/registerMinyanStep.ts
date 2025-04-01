import { WhatsappClient } from "../../clients/WhatsappClient";
import { User } from "../../datasource/entities/User";
import {
  assignUserToAMinyan,
  saveUser,
} from "../../datasource/usersRepository";
import { WATextMessage } from "../../handlers/types";
import { Context } from "../context";
import { Step, UserContext } from "../types";

export const registerMinyanStep: Step = {
  id: "registerMinyanStep",
  action: async (
    userNum: number,
    waClient: WhatsappClient,
    message: WATextMessage,
    context: Context<UserContext>
  ) => {
    const userContext = (await context.get())?.context;

    if (!userContext) {
      throw new Error("context is missing - aborting");
    }

    if (isNaN(userContext.minyanId)) {
      throw new Error("minyanId is not defined in context");
    }

    if (!userContext.isUserExists) {
      let user = new User();
      user.phone = String(userNum);
      user.name = message.recipient.name || String(userNum);
      user = await saveUser(user);
      userContext.userId = user.id;

      console.log("userId is not defined - created new user", user);
    }

    if (isNaN(userContext.userId)) {
      throw new Error("userId is not defined in context");
    }

    await assignUserToAMinyan(userContext.userId, userContext.minyanId);

    let responseText = "ההרשמה למניין בוצעה בהצלחה!";
    responseText += "\n\n";
    responseText +=
      "מעכשיו, אני אעדכן אותך לגבי תפילות שמתקיימות ושינויים שנוגעים למניין זה.";

    await waClient.sendTextMessage(userNum, responseText);
    await context.delete();
  },
  getNextStepId: async (userText: string, context: Context<UserContext>) =>
    Promise.resolve(undefined),
};
