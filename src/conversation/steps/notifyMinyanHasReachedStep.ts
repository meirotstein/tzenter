import { DateTime } from "luxon";
import { WhatsappClient } from "../../clients/WhatsappClient";
import { Schedule } from "../../datasource/entities/Schedule";
import { getUserByPhone } from "../../datasource/usersRepository";
import { WATextMessage } from "../../handlers/types";
import { prayerHebName } from "../../utils";
import { Context, ContextType } from "../context";
import { ScheduleContext, Step, UserContext } from "../types";

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

    let responseText = "יש מניין!\n\n";
    responseText += `המתפללים הבאים אשרו הגעה לתפילת ${prayerHebName(
      schedule.prayer
    )} במניין ${schedule.minyan.name} בשעה ${DateTime.fromISO(
      schedule.time
    ).toFormat("HH:mm")}\n\n`;

    let count = 0;
    for (const phoneNum in approved) {
      const user = await getUserByPhone(phoneNum);
      responseText += `${++count}. ${user?.name || phoneNum}\n`;

      if (approved[String(phoneNum)] > 1) {
        for (let i = 1; i < approved[String(phoneNum)]; i++) {
          responseText += `${++count}. ${user?.name || phoneNum} (${i + 1})\n`;
        }
      }
    }

    responseText += "\n\n";
    responseText += "בבקשה להגיע בזמן";

    await waClient.sendTextMessage(userNum, responseText);

    await context.delete();

    console.log("user updated schedule", { userNum, scheduleId: schedule.id });
  },
  getNextStepId: async (userText: string, context: Context<UserContext>) =>
    Promise.resolve(undefined),
};
