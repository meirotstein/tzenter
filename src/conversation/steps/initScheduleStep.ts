import { WhatsappClient } from "../../clients/WhatsappClient";
import { Minyan } from "../../datasource/entities/Minyan";
import { Schedule } from "../../datasource/entities/Schedule";
import { UnexpectedUserInputError } from "../../errors";
import { WATextMessage } from "../../handlers/types";
import { scheduleAnnouncements } from "../../schedule/scheduleAnnouncements";
import { prayerHebName } from "../../utils";
import { Context } from "../context";
import { Step, UserContext } from "../types";
import templates from "../waTemplates";
import { approveScheduleStep } from "./approveScheduleStep";
import { rejectScheduleStep } from "./rejectScheduleStep";
import { snoozeScheduleStep } from "./snoozeScheduleStep";
const { DateTime } = require("luxon");

const expectedUserResponses = {
  iWIllArrive: "אגיע",
  iWillNotArrive: "לא אגיע",
  snooze: "שאל אותי מאוחר יותר",
};

export const initScheduleStep: Step = {
  id: "initScheduleStep",
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
    const minyan: Minyan = userContext.minyan;

    console.log("sending schedule by system", {
      minyanId: minyan.id,
      userNum,
    });

    const scheduleMessages = await scheduleAnnouncements(schedule, new Date());

    let scheduleTemplate = scheduleMessages.length
      ? templates.schedule_by_system_with_announcements
      : templates.schedule_by_system;

    let params: Record<string, string> = {
      minyan_name: minyan.name,
      prayer: prayerHebName(schedule.prayer),
      time: DateTime.fromISO(schedule.time).toFormat("HH:mm"),
    };

    if (scheduleMessages.length) {
      params.custom_msg = `[${scheduleMessages.join(" | ")}]`;
    }

    // TODO: for testing purposes only
    if (userNum === 972547488557) {
      scheduleTemplate = templates.minyan_appointment_reminder;

      params = {
        "1": minyan.name,
        "2": prayerHebName(schedule.prayer),
        "3": DateTime.fromISO(schedule.time).toFormat("HH:mm"),
        "4": scheduleMessages.length
          ? `[${scheduleMessages.join(" | ")}]`
          : "-",
      };
    }

    const res = await waClient.sendTemplateMessage(
      userNum,
      scheduleTemplate,
      params
    );

    console.log("schedule by system sent", res);
  },
  getNextStepId: async (userText: string, context: Context<UserContext>) => {
    switch (userText) {
      case expectedUserResponses.iWIllArrive:
        return approveScheduleStep.id;
      case expectedUserResponses.iWillNotArrive:
        return rejectScheduleStep.id;
      case expectedUserResponses.snooze:
        return snoozeScheduleStep.id;
      default:
        throw new UnexpectedUserInputError(userText);
    }
  },
};
