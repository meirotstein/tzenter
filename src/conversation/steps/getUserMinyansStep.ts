import { WhatsappClient } from "../../clients/WhatsappClient";
import { getUserByPhone } from "../../datasource/usersRepository";
import { Step } from "../types";

export const getUserMinyansStep: Step = {
  id: "initialMenuStep",
  action: async (
    userNum: number,
    waClient: WhatsappClient,
    userText: string,
    context?: Record<string, any>
  ) => {
    let user = await getUserByPhone(userNum.toString());
    if (!user || !user.minyans?.length) {
      await waClient.sendTextMessage(userNum, "אתה לא רשום כרגע לאף מניין");
    } else {
      let minyansText = "המניינים שלך: %0A";
      user.minyans.forEach((minyan, index) => {
        minyansText += `${index + 1}. ${minyan.name} %0A`;
      });
    }
  },
  getNextStepId: (userText: string, context?: Record<string, any>) => undefined,
};
