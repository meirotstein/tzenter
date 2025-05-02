import { DateTime } from "luxon";
import { WhatsappClient } from "../../clients/WhatsappClient";
import { Minyan } from "../../datasource/entities/Minyan";
import { Schedule } from "../../datasource/entities/Schedule";
import { getUserByPhone } from "../../datasource/usersRepository";
import { UnexpectedUserInputError } from "../../errors";
import { WATextMessage } from "../../handlers/types";
import { isLastExecution, prayerHebName } from "../../utils";
import { noWords, yesWords } from "../consts";
import { Context, ContextType } from "../context";
import { ScheduleContext, Step, UserContext } from "../types";
import { approveScheduleStep } from "./approveScheduleStep";
import { rejectScheduleStep } from "./rejectScheduleStep";
import { snoozeScheduleStep } from "./snoozeScheduleStep";
import { getMessage, messages } from "../messageTemplates";

const expectedUserResponses = {
  iWIllArrive: "אגיע",
  iWillNotArrive: "לא אגיע",
  snooze: "שאל אותי מאוחר יותר",
};

export const processScheduleStep: Step = {
  id: "processScheduleStep",
  action: async (
    userNum: number,
    waClient: WhatsappClient,
    message: WATextMessage,
    context: Context<UserContext>
  ) => {
    const userContext = (await context.get())?.context;
    if (!userContext?.minyan || !userContext?.schedule) {
      console.log(
        "Minyan or schedule not found, user is out of context. aborting"
      );
      return;
    }

    const schedule: Schedule = userContext.schedule;
    const minyan: Minyan = userContext.minyan;

    const scheduleContext = Context.getContext<ScheduleContext>(
      String(schedule.id),
      ContextType.Schedule
    );

    if (!scheduleContext) {
      throw new Error("Schedule context not found");
    }

    const scheduleContextData = await scheduleContext.get();

    if (!scheduleContextData) {
      console.log("Schedule context not found");
      return;
    }

    const approved = scheduleContextData.approved || {};
    const snoozed = new Set(scheduleContextData.snoozed || []);
    const rejected = new Set(scheduleContextData.rejected || []);

    if (rejected.has(String(userNum))) {
      return;
    }

    if (!!approved[String(userNum)]) {
      const scheduleInterval = +(
        process.env.SCHEDULE_INVOCATION_INTERVAL_MIN || 14
      );
      if (
        scheduleContextData.notified &&
        !isLastExecution(schedule.time, scheduleInterval)
      ) {
        console.log("skipping schedule - already notified", {
          scheduleId: schedule.id,
          userNum,
        });
        return;
      }

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
          minyanName: minyan.name,
          hour: DateTime.fromISO(schedule.time).toFormat("HH:mm"),
          pray: prayerHebName(schedule.prayer),
          prayers,
        })
      );

      await context.delete();
      return;
    }

    if (snoozed.has(String(userNum))) {
      await context.update({
        context: { ...userContext, processSnoozed: true },
      });

      await waClient.sendTextMessage(
        userNum,
        getMessage(messages.SNOOZE_REMINDER, {
          minyanName: minyan.name,
          hour: DateTime.fromISO(schedule.time).toFormat("HH:mm"),
          pray: prayerHebName(schedule.prayer),
        })
      );
      return;
    }
  },
  getNextStepId: async (userText: string, context: Context<UserContext>) => {
    const userContext = (await context.get())?.context;
    if (!userContext) {
      throw new Error("User context not found");
    }

    if (
      userText === expectedUserResponses.iWIllArrive ||
      yesWords.includes(userText)
    ) {
      return approveScheduleStep.id;
    }
    if (
      userText === expectedUserResponses.iWillNotArrive ||
      noWords.includes(userText)
    ) {
      return rejectScheduleStep.id;
    }
    if (userText === expectedUserResponses.snooze) {
      return snoozeScheduleStep.id;
    }

    throw new UnexpectedUserInputError(userText);
  },
};
