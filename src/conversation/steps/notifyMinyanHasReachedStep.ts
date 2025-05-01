import { DateTime } from "luxon";
import { WhatsappClient } from "../../clients/WhatsappClient";
import { Schedule } from "../../datasource/entities/Schedule";
import { getUserByPhone } from "../../datasource/usersRepository";
import { WATextMessage } from "../../handlers/types";
import { Context, ContextType } from "../context";
import { getMessage, messages } from "../messageTemplates";
import { ScheduleContext, Step, UserContext } from "../types";
import { prayerHebName } from "../../utils";

export const notifyMinyanHasReachedStep: Step = {
  id: "notifyMinyanHasReachedStep",
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

    const scheduleContext = await Context.getContext<ScheduleContext>(
      String(schedule.id),
      ContextType.Schedule
    ).get();

    if (!scheduleContext) {
      throw new Error(
        "Schedule context not found when trying to notify user for minyan"
      );
    }

    const approved = scheduleContext?.approved || {};

    const prayers = [];

    // let responseText = "יש מניין!\n\n";
    // responseText += `המתפללים הבאים אשרו הגעה לתפילת ${prayerHebName(
    //   schedule.prayer
    // )} במניין ${schedule.minyan.name} בשעה ${DateTime.fromISO(
    //   schedule.time
    // ).toFormat("HH:mm")}\n\n`;

    let count = 0;
    for (const phoneNum in approved) {
      const user = await getUserByPhone(phoneNum);
      prayers.push(user?.name || phoneNum);

      if (approved[String(phoneNum)] > 1) {
        for (let i = 1; i < approved[String(phoneNum)]; i++) {
          prayers.push(`${user?.name || phoneNum} (${i + 1})`);
        }
      }
    }

    await waClient.sendTextMessage(
      userNum,
      getMessage(messages.MINYAN_REACHED_WITH_LIST, {
        prayers,
        minyanName: schedule.minyan.name,
        hour: DateTime.fromISO(schedule.time).toFormat("HH:mm"),
        pray: prayerHebName(schedule.prayer),
      })
    );

    await context.delete();

    console.log("user updated schedule", { userNum, scheduleId: schedule.id });
  },
  getNextStepId: async (userText: string, context: Context<UserContext>) =>
    Promise.resolve(undefined),
};
