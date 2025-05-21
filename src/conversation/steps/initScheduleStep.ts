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

    const scheduleTemplate = templates.minyan_appointment_reminder;

    const params = {
      "1": minyan.name,
      "2": prayerHebName(schedule.prayer),
      "3": DateTime.fromISO(schedule.time).toFormat("HH:mm"),
      "4": scheduleMessages.length ? `[${scheduleMessages.join(" | ")}]` : "-",
    };

    const replyIds = [
      `approve:${schedule.id}`,
      `reject:${schedule.id}`,
      `snooze:${schedule.id}`,
    ];

    const res = await waClient.sendTemplateMessage(
      userNum,
      scheduleTemplate,
      params,
      replyIds
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
