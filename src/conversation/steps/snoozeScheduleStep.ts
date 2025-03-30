import { WhatsappClient } from "../../clients/WhatsappClient";
import { Schedule } from "../../datasource/entities/Schedule";
import { Context, ContextType } from "../context";
import { ScheduleContext, Step, UserContext } from "../types";

export const snoozeScheduleStep: Step = {
  id: "snoozeScheduleStep",
  action: async (
    userNum: number,
    waClient: WhatsappClient,
    userText: string,
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

    const snoozed = new Set(scheduleContextData?.snoozed || []);

    snoozed.add(String(userNum));

    await scheduleContext.update({
      snoozed: Array.from(snoozed),
    });

    await waClient.sendTextMessage(userNum, "קיבלתי, אני אשאל אותך בהמשך");

    console.log("user snoozed schedule", { userNum, scheduleId: schedule.id });
  },
  getNextStepId: async (userText: string, context: Context<UserContext>) =>
    Promise.resolve(undefined),
};
