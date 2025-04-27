import { WhatsappClient } from "../../clients/WhatsappClient";
import { getAllMinyans } from "../../datasource/minyansRepository";
import { getUserByPhone } from "../../datasource/usersRepository";
import { UnexpectedUserInputError } from "../../errors";
import { WATextMessage } from "../../handlers/types";
import { Context } from "../context";
import { getMessage, messages } from "../messageTemplates";
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
      await waClient.sendTextMessage(userNum, messages.NO_AVAILABLE_MINYANS);
    } else {
      minyans.forEach((minyan, index) => {
        const isUserRegistered = !!user?.minyans?.find(
          (userMinyan) => userMinyan.id === minyan.id
        );
        const currentMinyan = {
          name: minyan.name,
          minyanId: minyan.id,
          minyanIndex: index + 1,
          isUserRegistered,
        };
        availableMinyans.push(currentMinyan);
      });
      let minyansText = getMessage(messages.AVAILABLE_MINYANS_LIST, {
        availableMinyans,
      });
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
