import { WhatsappClient } from "../../clients/WhatsappClient";
import { dadJokes } from "../../dadJokes";
import { Context } from "../context";
import { Step, UserContext } from "../types";

export const dadJokeStep: Step = {
  id: "dadJokeStep",
  action: async (
    userNum: number,
    waClient: WhatsappClient,
    userText: string,
    context: Context<UserContext>
  ) => {
    const index = Math.floor(Math.random() * dadJokes.length);

    await waClient.sendTextMessage(userNum, dadJokes[index].joke);
    await context.delete();
  },
  getNextStepId: async (userText: string, context: Context<UserContext>) =>
    Promise.resolve(undefined),
};
