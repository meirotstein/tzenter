import { WhatsappClient } from "../../clients/WhatsappClient";
import { Schedule } from "../../datasource/entities/Schedule";
import { getScheduleById } from "../../datasource/scheduleRepository";
import { WATextMessage } from "../../handlers/types";
import { notifyIfMinyanReached } from "../../schedule/notifyIfMinyanReached";
import { hasScheduleTimePassed } from "../../schedule/scheduleTimeUtils";
import { Context, ContextType } from "../context";
import { messages } from "../messageTemplates";
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
    let schedule: Schedule | undefined | null;

    const userContext = (await context.get())?.context;
    userContext?.schedule;

    // Payload means that the user clicked on a template message button
    const payload = message?.payload;
    const match = payload?.match(/^approve:(\d+)$/);
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
      throw new Error("Minyan or schedule not found in context");
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

    console.debug("user approved schedule", {
      userNum,
      scheduleId: schedule.id,
      forUpdate,
    });

    await scheduleContext.update(forUpdate);

    await waClient.sendTextMessage(userNum, messages.APPROVAL_ACCEPTED);
    await notifyIfMinyanReached(
      waClient,
      schedule,
      scheduleContext,
      String(userNum)
    );

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
