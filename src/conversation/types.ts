import { WhatsappClient } from "../clients/WhatsappClient";
import { Context } from "./context";

export type Step = {
  id: string;
  action: (
    userNum: number,
    waClient: WhatsappClient,
    userText: string,
    context: Context
  ) => Promise<void>;
  getNextStepId: (
    userText: string,
    context: Context
  ) => Promise<string | undefined>;
};
