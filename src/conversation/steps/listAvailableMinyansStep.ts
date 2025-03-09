import { WhatsappClient } from "../../clients/WhatsappClient";
import { getAllMinyans } from "../../datasource/minyansRepository";
import { getUserByPhone } from "../../datasource/usersRepository";
import { Step } from "../types";

export const listAvailableMinyansStep: Step = {
  id: "listAvailableMinyansStep",
  action: async (
    userNum: number,
    waClient: WhatsappClient,
    userText: string,
    context?: Record<string, any>
  ) => {
    let user = await getUserByPhone(userNum.toString());
    const minyans = await getAllMinyans();
    if (!minyans?.length) {
      await waClient.sendTextMessage(userNum, "אין מניינים זמינים כרגע");
    } else {
      let minyansText = "המניינים הזמינים: %0A";
      minyans.forEach((minyan, index) => {
        minyansText += `${index + 1}. ${minyan.name} %0A`;
      });
      await waClient.sendTextMessage(userNum, minyansText);
    }
  },
  getNextStepId: (userText: string, context?: Record<string, any>) => undefined,
};
