import { WhatsappClient } from "../../clients/WhatsappClient";
import { getUserByPhone } from "../../datasource/usersRepository";
import { UnexpectedUserInputError } from "../../errors";
import { noWords, yesWords } from "../consts";
import { Context } from "../context";
import { Step, UserContext } from "../types";
import { listAvailableMinyansStep } from "./listAvailableMinyansStep";
import { selectedMinyanStep } from "./selectedMinyanStep";

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
      let minyansText = "אתה לא רשום כרגע לאף מניין\n\n";
      minyansText += "האם אתה מעוניין להירשם?";
      await waClient.sendTextMessage(userNum, minyansText);
      await context.update({ context: { userMinyans: [] } });
    } else {
      let minyansText = "המניינים שלך: \n\n";
      let userMinyans: Array<{ minyanId: number; minyanIndex: number }> = [];
      user.minyans.forEach((minyan, index) => {
        userMinyans.push({ minyanId: minyan.id, minyanIndex: index + 1 });
        minyansText += `${index + 1}. ${minyan.name}\n`;
      });
      minyansText += `\n\n כדי להמשיך יש להזין את מספר המניין הרצוי`;
      await waClient.sendTextMessage(userNum, minyansText);
      await context.update({ context: { userMinyans } });
    }
  },
  getNextStepId: async (userText: string, context: Context<UserContext>) => {
    const userContext = (await context.get())?.context;

    if (!userContext?.userMinyans) {
      throw new Error("userContext is not defined");
    }

    const userMinyans: Array<{ minyanId: number; minyanIndex: number }> =
      userContext.userMinyans;

    if (!userMinyans.length) {
      if (yesWords.includes(userText.toLowerCase())) {
        return listAvailableMinyansStep.id;
      }
      if (noWords.includes(userText.toLowerCase())) {
        await context.delete();
        return undefined;
      }
      console.log("userText is not a valid selection", userText);
      throw new UnexpectedUserInputError(userText);
    }

    const expectedSelection = Number(userText);
    if (isNaN(expectedSelection)) {
      console.log("userText is not a number", userText);
      throw new UnexpectedUserInputError(userText);
    }

    const selection = userMinyans?.find(
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
