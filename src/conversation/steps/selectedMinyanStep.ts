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
import { sendManageMinyanLinkStep } from "./sendManageMinyanLinkStep";
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
    const isUserAdmin = !!user?.adminMinyans?.find(
      (adminMinyan) => adminMinyan.id === selectedMinyanId
    );

    const responseText = getMessage(
      isUserRegistered && isUserAdmin
        ? messages.ADMIN_MINYAN_ACTIONS
        : isUserRegistered
        ? messages.UNREGISTER_MINYAN_CONFIRMATION
        : messages.REGISTER_MINYAN_CONFIRMATION,
      { minyanName: minyan.name }
    );
    await waClient.sendTextMessage(userNum, responseText);
    await context.update({
      context: {
        isUserRegistered,
        isUserAdmin,
        isUserExists: !!user,
        userId: user?.id,
        minyanId: minyan.id,
      },
    });
  },
  getNextStepId: async (userText: string, context: Context<UserContext>) => {
    const selectedContext = (await context.get())?.context;
    if (selectedContext?.isUserRegistered && selectedContext?.isUserAdmin) {
      if (userText === "1") {
        return sendManageMinyanLinkStep.id;
      }
      if (userText === "2") {
        return unregisterMinyanStep.id;
      }
      throw new UnexpectedUserInputError(userText);
    }

    if (yesWords.includes(userText.toLowerCase())) {
      const isUserRegistered = selectedContext?.isUserRegistered;
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
