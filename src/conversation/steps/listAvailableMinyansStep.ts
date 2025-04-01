import { WhatsappClient } from "../../clients/WhatsappClient";
import { getAllMinyans } from "../../datasource/minyansRepository";
import { getUserByPhone } from "../../datasource/usersRepository";
import { UnexpectedUserInputError } from "../../errors";
import { WATextMessage } from "../../handlers/types";
import { Context } from "../context";
import { Step, UserContext } from "../types";
import { selectedMinyanStep } from "./selectedMinyanStep";

export const listAvailableMinyansStep: Step = {
  id: "listAvailableMinyansStep",
  action: async (
    userNum: number,
    waClient: WhatsappClient,
    message: WATextMessage,
    context: Context<UserContext>
  ) => {
    let user = await getUserByPhone(userNum.toString());
    const minyans = await getAllMinyans();
    const availableMinyans: Array<{ minyanId: number; minyanIndex: number }> =
      [];
    if (!minyans?.length) {
      await waClient.sendTextMessage(userNum, "אין מניינים זמינים כרגע");
    } else {
      let minyansText = "המניינים הזמינים: \n\n";
      minyans.forEach((minyan, index) => {
        const currentMinyan = { minyanId: minyan.id, minyanIndex: index + 1 };
        const isUserRegistered = !!user?.minyans?.find(
          (userMinyan) => userMinyan.id === minyan.id
        );
        minyansText += `${currentMinyan.minyanIndex}. ${minyan.name}${
          isUserRegistered ? " *" : ""
        }\n`;
        availableMinyans.push(currentMinyan);
      });
      minyansText += `\n\n כדי להמשיך יש להזין את מספר המניין הרצוי`;
      await waClient.sendTextMessage(userNum, minyansText);
      await context.update({ context: { availableMinyans } });
    }
  },
  getNextStepId: async (userText: string, context: Context<UserContext>) => {
    const expectedSelection = Number(userText);
    if (isNaN(expectedSelection)) {
      console.log("userText is not a number", userText);
      throw new UnexpectedUserInputError(userText);
    }
    const availableMinyans: Array<{ minyanId: number; minyanIndex: number }> = (
      await context.get()
    )?.context?.availableMinyans;

    const selection = availableMinyans?.find(
      (minyan) => minyan.minyanIndex === expectedSelection
    );

    if (!selection) {
      console.log("userText is not a valid selection", userText);
      throw new UnexpectedUserInputError(userText);
    }

    await context.update({
      context: { selectedMinyanId: selection.minyanId },
    });
    return Promise.resolve(selectedMinyanStep.id);
  },
};
