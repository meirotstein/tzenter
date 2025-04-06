import { WhatsappClient } from "../clients/WhatsappClient";
import { WATextMessage } from "../handlers/types";
import { Context } from "./context";

export type Step = {
  id: string;
  action: (
    userNum: number,
    waClient: WhatsappClient,
    message: WATextMessage,
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
  userName?: string;
};

export type ScheduleContext = {
  status: ScheduleStatus;
  startedAt?: number;
  approved?: Record<string, number>;
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
