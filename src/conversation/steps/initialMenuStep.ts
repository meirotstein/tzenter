import { WhatsappClient } from "../../clients/WhatsappClient";
import { UnexpectedUserInputError } from "../../errors";
import { Step } from "../types";
import templates from "../waTemplates";
import { getUserMinyansStep } from "./getUserMinyansStep";
import { listAvailableMinyansStep } from "./listAvailableMinyansStep";

const expectedUserResponses = {
  MyMinyans: "המניינים שלי",
  JoinMinyan: "הצטרפות למניין",
};

export const initialMenuStep: Step = {
  id: "initialMenuStep",
  action: async (
    userNum: number,
    waClient: WhatsappClient,
    userText: string,
    context?: Record<string, any>
  ) => {
    const resp = await waClient.sendTemplateMessage(
      userNum,
      templates.greetings
    );
    console.log("response from whatsapp", resp);
  },
  getNextStepId: (userText: string, context?: Record<string, any>) => {
    if (userText === expectedUserResponses.MyMinyans) {
      return getUserMinyansStep.id;
    } else if (userText === expectedUserResponses.JoinMinyan) {
      return listAvailableMinyansStep.id;
    }
    throw new UnexpectedUserInputError(userText);
  },
};
