import { WhatsappClient } from "../../clients/WhatsappClient";
import { getMinyanById } from "../../datasource/minyansRepository";
import { getUserByPhone } from "../../datasource/usersRepository";
import { UnexpectedUserInputError } from "../../errors";
import { WATextMessage } from "../../handlers/types";
import { noWords, yesWords } from "../consts";
import { Context } from "../context";
import { getMessage, messages } from "../messageTemplates";
import { Step, UserContext } from "../types";
import { registerMinyanStep } from "./registerMinyanStep";
import { unregisterMinyanStep } from "./unregisterMinyanStep";

export const selectedMinyanStep: Step = {
  id: "selectedMinyanStep",
  action: async (
    userNum: number,
    waClient: WhatsappClient,
    message: WATextMessage,
    context: Context<UserContext>
  ) => {
    const selectedMinyanId = (await context.get())?.context?.selectedMinyanId;
    if (!selectedMinyanId) {
      throw new Error("selectedMinyan is not defined in context");
    }
    const user = await getUserByPhone(userNum.toString());

    const minyan = await getMinyanById(selectedMinyanId);
    if (!minyan) {
      throw new Error("minyan is not defined");
    }

    const isUserRegistered = !!user?.minyans?.find(
      (userMinyan) => userMinyan.id === selectedMinyanId
    );

    const responseText = getMessage(
      isUserRegistered
        ? messages.UNREGISTER_MINYAN_CONFIRMATION
        : messages.REGISTER_MINYAN_CONFIRMATION,
      { minyanName: minyan.name }
    );
    await waClient.sendTextMessage(userNum, responseText);
    await context.update({
      context: {
        isUserRegistered,
        isUserExists: !!user,
        userId: user?.id,
        minyanId: minyan.id,
      },
    });
  },
  getNextStepId: async (userText: string, context: Context<UserContext>) => {
    if (yesWords.includes(userText.toLowerCase())) {
      const isUserRegistered = (await context.get())?.context?.isUserRegistered;
      if (isUserRegistered) {
        return unregisterMinyanStep.id;
      }
      return registerMinyanStep.id;
    }
    if (noWords.includes(userText.toLowerCase())) {
      await context.delete();
      return undefined;
    }
    throw new UnexpectedUserInputError(userText);
  },
};
