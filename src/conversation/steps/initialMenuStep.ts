import { WhatsappClient } from "../../clients/WhatsappClient";
import { UnexpectedUserInputError } from "../../errors";
import { WATextMessage } from "../../handlers/types";
import { Context } from "../context";
import { messages } from "../messageTemplates";
import { Step, UserContext } from "../types";
import { dadJokeStep } from "./dadJokeStep";
import { getUserMinyansStep } from "./getUserMinyansStep";
import { listAvailableMinyansStep } from "./listAvailableMinyansStep";

const expectedUserResponses = {
  MyMinyans: "1",
  JoinMinyan: "2",
  DadJoke: "3",
};

export const initialMenuStep: Step = {
  id: "initialMenuStep",
  action: async (
    userNum: number,
    waClient: WhatsappClient,
    message: WATextMessage,
    context: Context<UserContext>
  ) => {
    const resp = await waClient.sendTextMessage(userNum, messages.INITIAL);
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
    } else if (userText === expectedUserResponses.DadJoke) {
      return Promise.resolve(dadJokeStep.id);
    }
    return Promise.reject(new UnexpectedUserInputError(userText));
  },
};
