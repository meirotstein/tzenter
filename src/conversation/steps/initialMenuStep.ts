import { WhatsappClient } from "../../clients/WhatsappClient";
import { UnexpectedUserInputError } from "../../errors";
import { Step } from "../types";
import templates from "../waTemplates";
import { getUserMinyansStep } from "./getUserMinyansStep";
import { listAvailableMinyansStep } from "./listAvailableMinyansStep";

const expectedUserResponses = {
  MyMinyans: "1",
  JoinMinyan: "2",
};

const MESSAGE = `שלום, כאן צענטר 🤖 - התפילבוט שלך.

הקש את מספר האפשרות הרצויה:

1. המניינים שלי
2. הצטרפות למניין

[בכל שלב - רק תכתוב צענטר ונחזור לכאן]
`;

export const initialMenuStep: Step = {
  id: "initialMenuStep",
  action: async (
    userNum: number,
    waClient: WhatsappClient,
    userText: string,
    context?: Record<string, any>
  ) => {
    const resp = await waClient.sendTextMessage(userNum, MESSAGE);
    console.log("response from whatsapp", resp);
  },
  getNextStepId: (
    userText: string,
    context?: Record<string, any>
  ): string | undefined => {
    console.log("received userText on initialMenuStep.getNextStepId", userText);
    if (userText === expectedUserResponses.MyMinyans) {
      return getUserMinyansStep.id;
    } else if (userText === expectedUserResponses.JoinMinyan) {
      return listAvailableMinyansStep.id;
    }
    throw new UnexpectedUserInputError(userText);
  },
};
