import { WhatsappClient } from "../../clients/WhatsappClient";
import { Schedule } from "../../datasource/entities/Schedule";
import { getScheduleById } from "../../datasource/scheduleRepository";
import { WATextMessage } from "../../handlers/types";
import { hasScheduleTimePassed } from "../../schedule/scheduleTimeUtils";
import { Context, ContextType } from "../context";
import { messages } from "../messageTemplates";
import { ScheduleContext, Step, UserContext } from "../types";

export const snoozeScheduleStep: Step = {
  id: "snoozeScheduleStep",
  action: async (
    userNum: number,
    waClient: WhatsappClient,
    message: WATextMessage,
    context: Context<UserContext>
  ) => {
    let schedule: Schedule | undefined | null;

    const userContext = (await context.get())?.context;
    userContext?.schedule;

    // Payload means that the user clicked on a template message button
    const payload = message?.payload;
    const match = payload?.match(/^snooze:(\d+)$/);
    if (match && match[1]) {
      const scheduleId = match[1];

      if (+scheduleId === userContext?.schedule?.id) {
        schedule = userContext?.schedule;
      } else {
        schedule = await getScheduleById(+scheduleId);
      }
    } else {
      schedule = userContext?.schedule;
    }
    if (!schedule) {
      throw new Error("Schedule not found in context");
    }

    const scheduleContext = Context.getContext<ScheduleContext>(
      String(schedule.id),
      ContextType.Schedule
    );

    if (!scheduleContext) {
      throw new Error("Schedule context not found");
    }

    // TODO: might need to use a mutex-like functions for that kind of update
    const scheduleContextData = await scheduleContext.get();

    if (!scheduleContextData || hasScheduleTimePassed(scheduleContextData, 5)) {
      console.log("schedule time has already passed", {
        userNum,
        scheduleId: schedule.id,
        scheduleTime: schedule.time,
        timezone: "Asia/Jerusalem",
      });
      await waClient.sendTextMessage(userNum, messages.SCHEDULE_TIME_PASSED);
      return;
    }

    const snoozed = new Set(scheduleContextData?.snoozed || []);

    snoozed.add(String(userNum));

    await scheduleContext.update({
      snoozed: Array.from(snoozed),
    });

    await waClient.sendTextMessage(userNum, messages.SNOOZED_ACCEPTED);

    await context.delete();

    console.log("user snoozed schedule", { userNum, scheduleId: schedule.id });
  },
  getNextStepId: async (userText: string, context: Context<UserContext>) =>
    Promise.resolve(undefined),
};
