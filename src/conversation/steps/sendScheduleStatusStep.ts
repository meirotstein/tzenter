import { DateTime } from "luxon";
import { WhatsappClient } from "../../clients/WhatsappClient";
import { getScheduleById } from "../../datasource/scheduleRepository";
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

    if (!userContext?.scheduleId) {
      throw new Error(
        `Schedule not found in user context, id: ${userContext?.scheduleId}`
      );
    }

    const scheduleContextData = await Context.getContext<ScheduleContext>(
      String(userContext.scheduleId),
      ContextType.Schedule
    ).get();

    if (!scheduleContextData) {
      throw new Error(
        `Schedule context not found, id: ${userContext.scheduleId}`
      );
    }

    const scheduleEntity = await getScheduleById(userContext.scheduleId);

    if (!scheduleEntity) {
      throw new Error(
        `Schedule entity not found, id: ${userContext.scheduleId}`
      );
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

    await waClient.sendTextMessage(
      userNum,
      getMessage(messages.MINYAN_ATTENDANCE_UPDATE, {
        minyanName: scheduleEntity.minyan.name,
        hour: DateTime.fromISO(scheduleEntity.time).toFormat("HH:mm"),
        pray: prayerHebName(scheduleEntity.prayer),
        prayers,
      })
    );

    await context.delete();
  },
  getNextStepId: async (userText: string, context: Context<UserContext>) =>
    Promise.resolve(undefined),
};
