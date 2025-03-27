import { WhatsappClient } from "../../clients/WhatsappClient";
import { Minyan } from "../../datasource/entities/Minyan";
import { Schedule } from "../../datasource/entities/Schedule";
import { prayerHebName } from "../../utils";
import { Context } from "../context";
import { Step, UserContext } from "../types";
import templates from "../waTemplates";
const { DateTime } = require("luxon");

export const initScheduleStep: Step = {
  id: "initScheduleStep",
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
    const minyan: Minyan = userContext.minyan;

    await waClient.sendTemplateMessage(userNum, templates.schedule_by_system, {
      minyan_name: minyan.name,
      prayer: prayerHebName(schedule.prayer),
      time: DateTime.fromISO(schedule.time).toFormat("HH:mm"),
    });
  },
  getNextStepId: async (userText: string, context: Context<UserContext>) =>
    Promise.resolve(undefined),
};
