import { WhatsappClient } from "../../clients/WhatsappClient";
import { UnexpectedUserInputError } from "../../errors";
import { WATextMessage } from "../../handlers/types";
import { Context } from "../context";
import { messages } from "../messageTemplates";
import { Step, UserContext } from "../types";
import { updateAdditionalMinyanAttendeesStep } from "./updateAdditionalMinyanAttendeesStep";

export const updateScheduleAttendeesStep: Step = {
  id: "updateScheduleAttendeesStep",
  action: async (
    userNum: number,
    waClient: WhatsappClient,
    message: WATextMessage,
    context: Context<UserContext>
  ) => {
    await waClient.sendTextMessage(userNum, messages.UPDATE_ATTENDEES_AMOUNT);

    console.log("asked the user for updated attendees amount", {
      userNum,
    });
  },
  getNextStepId: async (userText: string, context: Context<UserContext>) => {
    const expectedSelection = Number(userText);
    if (isNaN(expectedSelection)) {
      return Promise.reject(new UnexpectedUserInputError(userText));
    }
    return updateAdditionalMinyanAttendeesStep.id;
  },
};
