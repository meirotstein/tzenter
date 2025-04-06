import { WhatsappClient } from "../../clients/WhatsappClient";
import { Schedule } from "../../datasource/entities/Schedule";
import { WATextMessage } from "../../handlers/types";
import { Context, ContextType } from "../context";
import { ScheduleContext, Step, UserContext } from "../types";
import { updateAdditionalMinyanAttendeesStep } from "./updateAdditionalMinyanAttendeesStep";

export const approveScheduleStep: Step = {
  id: "approveScheduleStep",
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

    const approved = scheduleContextData?.approved || {};
    const snoozed = new Set(scheduleContextData?.snoozed || []);

    approved[String(userNum)] = 1;
    const isDeleted = snoozed.delete(String(userNum));

    const forUpdate: Partial<ScheduleContext> = {
      approved,
    };

    if (isDeleted) {
      forUpdate.snoozed = Array.from(snoozed);
    }

    await scheduleContext.update(forUpdate);

    let responseText = "קיבלתי, תודה על העדכון!\n";
    responseText += "אני אמשיך לעדכן אותך לגבי המניין.\n\n";
    responseText +=
      "במידה ותגיעו יותר מאדם אחד, בבקשה הזן את מספר הבאים (כולל אותך) עכשיו";

    await waClient.sendTextMessage(userNum, responseText);

    console.log("user approved schedule", { userNum, scheduleId: schedule.id });
  },
  getNextStepId: async (userText: string, context: Context<UserContext>) => {
    const expectedSelection = Number(userText);
    if (isNaN(expectedSelection)) {
      console.log(
        "approveScheduleStep: userText is not a number - aborting",
        userText
      );
      await context.delete();
      return undefined;
    }
    return updateAdditionalMinyanAttendeesStep.id;
  },
};
