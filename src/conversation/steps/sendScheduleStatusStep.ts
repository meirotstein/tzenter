import { DateTime } from "luxon";
import { WhatsappClient } from "../../clients/WhatsappClient";
import { Schedule } from "../../datasource/entities/Schedule";
import { getUserByPhone } from "../../datasource/usersRepository";
import { WATextMessage } from "../../handlers/types";
import { prayerHebName } from "../../utils";
import { Context, ContextType } from "../context";
import { getMessage, messages } from "../messageTemplates";
import { ScheduleContext, Step, UserContext } from "../types";

export const sendScheduleStatusStep: Step = {
  id: "sendScheduleStatusStep",
  action: async (
    userNum: number,
    waClient: WhatsappClient,
    message: WATextMessage,
    context: Context<UserContext>
  ) => {
    const userContext = (await context.get())?.context;

    if (!userContext?.schedule) {
      throw new Error(
        `Schedule not found in user context, id: ${userContext?.schedule?.id}`
      );
    }

    const schedule: Schedule = userContext.schedule;

    const scheduleContextData = await Context.getContext<ScheduleContext>(
      String(schedule.id),
      ContextType.Schedule
    ).get();

    if (!scheduleContextData) {
      throw new Error(`Schedule context not found, id: ${schedule.id}`);
    }

    const approved = scheduleContextData.approved || {};

    const prayers = [];
    for (const phoneNum in approved) {
      const user = await getUserByPhone(phoneNum);
      prayers.push(user?.name || phoneNum);

      if (approved[String(phoneNum)] > 1) {
        for (let i = 1; i < approved[String(phoneNum)]; i++) {
          prayers.push(`${user?.name || phoneNum} (${i + 1})`);
        }
      }
    }

    const scheduleHour =
      scheduleContextData?.calculatedHour ||
      DateTime.fromISO(schedule.time).toFormat("HH:mm");

    await waClient.sendTextMessage(
      userNum,
      getMessage(messages.MINYAN_ATTENDANCE_UPDATE, {
        minyanName: schedule.minyan.name,
        hour: scheduleHour,
        pray: prayerHebName(schedule.prayer),
        prayers,
      })
    );

    await context.delete();
  },
  getNextStepId: async (userText: string, context: Context<UserContext>) =>
    Promise.resolve(undefined),
};
