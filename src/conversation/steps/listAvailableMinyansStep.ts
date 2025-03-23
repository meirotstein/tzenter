import { WhatsappClient } from "../../clients/WhatsappClient";
import { getAllMinyans } from "../../datasource/minyansRepository";
import { getUserByPhone } from "../../datasource/usersRepository";
import { Context } from "../context";
import { Step } from "../types";

export const listAvailableMinyansStep: Step = {
  id: "listAvailableMinyansStep",
  action: async (
    userNum: number,
    waClient: WhatsappClient,
    userText: string,
    context: Context
  ) => {
    let user = await getUserByPhone(userNum.toString());
    const minyans = await getAllMinyans();
    if (!minyans?.length) {
      await waClient.sendTextMessage(userNum, "אין מניינים זמינים כרגע");
    } else {
      let minyansText = "המניינים הזמינים: \n";
      minyans.forEach((minyan, index) => {
        const isUserRegistered = !!user?.minyans?.find(
          (userMinyan) => userMinyan.id === minyan.id
        );
        minyansText += `${index + 1}. ${minyan.name} ${
          isUserRegistered ? "*" : ""
        }\n`;
      });
      minyansText += `\n\n כדי להמשיך יש להזין את מספר המניין הרצוי`;
      await waClient.sendTextMessage(userNum, minyansText);
    }
  },
  getNextStepId: (userText: string, context: Context) => undefined,
};
