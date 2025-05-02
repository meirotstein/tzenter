import { WhatsappClient } from "../../clients/WhatsappClient";
import { Schedule } from "../../datasource/entities/Schedule";
import { WATextMessage } from "../../handlers/types";
import { Context, ContextType } from "../context";
import { messages } from "../messageTemplates";
import { ScheduleContext, Step, UserContext } from "../types";

export const rejectScheduleStep: Step = {
  id: "rejectScheduleStep",
  action: async (
    userNum: number,
    waClient: WhatsappClient,
    message: WATextMessage,
    context: Context<UserContext>
  ) => {
    const userContext = (await context.get())?.context;
    if (!userContext?.minyan || !userContext?.schedule) {
      throw new Error("Minyan or schedule not found in context");
    }

    const schedule: Schedule = userContext.schedule;

    const scheduleContext = Context.getContext<ScheduleContext>(
      String(schedule.id),
      ContextType.Schedule
    );

    if (!scheduleContext) {
      throw new Error("Schedule context not found");
    }

    // TODO: might need to use a mutex-like functions for that kind of update
    const scheduleContextData = await scheduleContext.get();

    const rejected = new Set(scheduleContextData?.rejected || []);

    rejected.add(String(userNum));

    await scheduleContext.update({
      rejected: Array.from(rejected),
    });

    await waClient.sendTextMessage(userNum, messages.REJECT_ACCEPTED);

    await context.delete();

    console.log("user rejected schedule", { userNum, scheduleId: schedule.id });
  },
  getNextStepId: async (userText: string, context: Context<UserContext>) =>
    Promise.resolve(undefined),
};
