import { WhatsappClient } from "../../clients/WhatsappClient";
import { Schedule } from "../../datasource/entities/Schedule";
import { Context, ContextType } from "../context";
import { ScheduleContext, Step, UserContext } from "../types";

export const approveScheduleStep: Step = {
  id: "approveScheduleStep",
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

    const approved = new Set(scheduleContextData?.approved || []);

    approved.add(String(userNum));

    await scheduleContext.update({
      approved: Array.from(approved),
    });

    await waClient.sendTextMessage(userNum, "קיבלתי, תודה על העדכון!\nאני אמשיך לעדכן אותך לגבי המניין.");

    await context.delete();

    console.log("user approved schedule", { userNum, scheduleId: schedule.id });
  },
  getNextStepId: async (userText: string, context: Context<UserContext>) =>
    Promise.resolve(undefined),
};
