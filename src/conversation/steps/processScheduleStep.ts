import { WhatsappClient } from "../../clients/WhatsappClient";
import { removeUserFromMinyan } from "../../datasource/usersRepository";
import { Context } from "../context";
import { Step, UserContext } from "../types";

export const processScheduleStep: Step = {
  id: "processScheduleStep",
  action: async (
    userNum: number,
    waClient: WhatsappClient,
    userText: string,
    context: Context<UserContext>
  ) => {
    
  },
  getNextStepId: async (userText: string, context: Context<UserContext>) =>
    Promise.resolve(undefined),
};
