import { WhatsappClient } from "../../clients/WhatsappClient";
import { Minyan } from "../../datasource/entities/Minyan";
import { Schedule } from "../../datasource/entities/Schedule";
import { UnexpectedUserInputError } from "../../errors";
import { WATextMessage } from "../../handlers/types";
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

    const res = await waClient.sendTemplateMessage(
      userNum,
      templates.schedule_by_system,
      {
        minyan_name: minyan.name,
        prayer: prayerHebName(schedule.prayer),
        time: DateTime.fromISO(schedule.time).toFormat("HH:mm"),
      }
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
