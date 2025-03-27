import { WhatsappClient } from "../../clients/WhatsappClient";
import { getUserByPhone } from "../../datasource/usersRepository";
import { Context } from "../context";
import { Step, UserContext } from "../types";

export const getUserMinyansStep: Step = {
  id: "getUserMinyansStep",
  action: async (
    userNum: number,
    waClient: WhatsappClient,
    userText: string,
    context: Context<UserContext>
  ) => {
    let user = await getUserByPhone(userNum.toString());
    if (!user || !user.minyans?.length) {
      await waClient.sendTextMessage(userNum, "אתה לא רשום כרגע לאף מניין");
    } else {
      let minyansText = "המניינים שלך: \n\n";
      user.minyans.forEach((minyan, index) => {
        minyansText += `${index + 1}. ${minyan.name}\n`;
      });
      await waClient.sendTextMessage(userNum, minyansText);
    }
  },
  getNextStepId: (userText: string, context: Context<UserContext>) =>
    Promise.resolve(undefined),
};
