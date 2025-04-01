import { WhatsappClient } from "../../clients/WhatsappClient";
import { dadJokes } from "../../dadJokes";
import { UnexpectedUserInputError } from "../../errors";
import { noWords, yesWords } from "../consts";
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

    let jokeText = dadJokes[index].joke;

    jokeText += "\n\n";
    jokeText += "עוד בדיחה?";

    await waClient.sendTextMessage(userNum, dadJokes[index].joke);
    await context.delete();
  },
  getNextStepId: async (userText: string, context: Context<UserContext>) => {
    if (yesWords.includes(userText.toLowerCase())) {
      return dadJokeStep.id;
    }
    if (noWords.includes(userText.toLowerCase())) {
      await context.delete();
      return undefined;
    }
    throw new UnexpectedUserInputError(userText);
  },
};
