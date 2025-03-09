import { WhatsappClient } from "../clients/WhatsappClient";

export type Step = {
  id: string;
  action: (
    userNum: number,
    waClient: WhatsappClient,
    userText: string,
    context?: Record<string, any>
  ) => Promise<void>;
  getNextStepId: (userText: string, context?: Record<string, any>) => string;
};
