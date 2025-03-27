import { WhatsappClient } from "../clients/WhatsappClient";
import { UserContext } from "../handlers/types";
import { Context } from "./context";

export type Step = {
  id: string;
  action: (
    userNum: number,
    waClient: WhatsappClient,
    userText: string,
    context: Context<UserContext>
  ) => Promise<void>;
  getNextStepId: (
    userText: string,
    context: Context<UserContext>
  ) => Promise<string | undefined>;
};
