import { WhatsappClient } from "../../clients/WhatsappClient";
import { Step } from "../types";
import templates from "../waTemplates";
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
  getNextStepId: (text: string, context?: Record<string, any>) =>
    "showMenuStep",
};
