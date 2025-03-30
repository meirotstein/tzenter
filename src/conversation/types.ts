import { WhatsappClient } from "../clients/WhatsappClient";
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

export type UserContext = {
  currentStepId?: string;
  context?: Record<string, any>;
  retry?: boolean;
};

export type ScheduleContext = {
  status: ScheduleStatus;
  approved?: Array<string>;
  rejected?: Array<string>;
  snoozed?: Array<string>;
  context?: Record<string, any>;
};

export enum ScheduleStatus {
  initiated = "initiated",
  processing = "processing",
  completed = "completed",
  failed = "failed",
}
