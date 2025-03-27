import { WhatsappClient } from "../../clients/WhatsappClient";
import { UnexpectedUserInputError } from "../../errors";
import { Context } from "../context";
import { Step, UserContext } from "../types";
import { getUserMinyansStep } from "./getUserMinyansStep";
import { listAvailableMinyansStep } from "./listAvailableMinyansStep";

const expectedUserResponses = {
  MyMinyans: "1",
  JoinMinyan: "2",
};

const MESSAGE = `שלום, כאן צענטר 🤖 - התפילבוט שלך.

הזן את מספר האפשרות הרצויה:

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
    context: Context<UserContext>
  ) => {
    const resp = await waClient.sendTextMessage(userNum, MESSAGE);
    console.log("response from whatsapp", resp);
  },
  getNextStepId: (
    userText: string,
    context: Context<UserContext>
  ): Promise<string | undefined> => {
    console.log("received userText on initialMenuStep.getNextStepId", userText);
    if (userText === expectedUserResponses.MyMinyans) {
      return Promise.resolve(getUserMinyansStep.id);
    } else if (userText === expectedUserResponses.JoinMinyan) {
      return Promise.resolve(listAvailableMinyansStep.id);
    }
    throw new UnexpectedUserInputError(userText);
  },
};
