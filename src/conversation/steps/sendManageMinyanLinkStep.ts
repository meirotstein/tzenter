import { WhatsappClient } from "../../clients/WhatsappClient";
import { getMinyanById } from "../../datasource/minyansRepository";
import { issueManageMinyanToken, buildManageMinyanUrl } from "../../manage/auth";
import { WATextMessage } from "../../handlers/types";
import { Context } from "../context";
import { getMessage, messages } from "../messageTemplates";
import { Step, UserContext } from "../types";

export const sendManageMinyanLinkStep: Step = {
  id: "sendManageMinyanLinkStep",
  action: async (
    userNum: number,
    waClient: WhatsappClient,
    message: WATextMessage,
    context: Context<UserContext>
  ) => {
    const userContext = (await context.get())?.context;
    if (isNaN(userContext?.userId) || isNaN(userContext?.minyanId)) {
      throw new Error("userId/minyanId is not defined in context");
    }

    const minyan = await getMinyanById(userContext!.minyanId);
    if (!minyan) {
      throw new Error("minyan is not defined");
    }

    const token = await issueManageMinyanToken({
      userId: userContext!.userId,
      minyanId: userContext!.minyanId,
      phone: String(userNum),
    });

    await waClient.sendTextMessage(
      userNum,
      getMessage(messages.MANAGE_MINYAN_LINK, {
        minyanName: minyan.name,
        manageUrl: buildManageMinyanUrl(token),
      })
    );
    await context.delete();
  },
  getNextStepId: async () => Promise.resolve(undefined),
};
