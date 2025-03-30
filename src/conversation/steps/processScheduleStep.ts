import { DateTime } from "luxon";
import { WhatsappClient } from "../../clients/WhatsappClient";
import { Minyan } from "../../datasource/entities/Minyan";
import { Schedule } from "../../datasource/entities/Schedule";
import { getUserByPhone } from "../../datasource/usersRepository";
import { UnexpectedUserInputError } from "../../errors";
import { prayerHebName } from "../../utils";
import { noWords, yesWords } from "../consts";
import { Context, ContextType } from "../context";
import { ScheduleContext, Step, UserContext } from "../types";
import { approveScheduleStep } from "./approveScheduleStep";
import { rejectScheduleStep } from "./rejectScheduleStep";

const expectedUserResponses = {
  iWIllArrive: "אגיע",
  iWillNotArrive: "לא אגיע",
};

export const processScheduleStep: Step = {
  id: "processScheduleStep",
  action: async (
    userNum: number,
    waClient: WhatsappClient,
    userText: string,
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

    const approved = new Set(scheduleContextData?.approved || []);
    const snoozed = new Set(scheduleContextData?.snoozed || []);
    const rejected = new Set(scheduleContextData?.rejected || []);

    if (rejected.has(String(userNum))) {
      return;
    }

    if (approved.has(String(userNum))) {
      let msg = `זוהי תזכורת לתפילת ${prayerHebName(
        schedule.prayer
      )} בשעה ${DateTime.fromISO(schedule.time).toFormat("HH:mm")} במניין ${
        minyan.name
      }

      נכון לרגע זה אשרו הגעה ${approved.size} מתפללים
      
      `;

      let count = 0;
      for (const phoneNum of approved) {
        const user = await getUserByPhone(phoneNum);
        msg += `${++count}. ${user?.name || phoneNum}\n`;
      }

      await waClient.sendTextMessage(userNum, msg);
      await context.delete();
      return;
    }

    if (snoozed.has(String(userNum))) {
      await context.update({
        context: { ...userContext, processSnoozed: true },
      });
      await waClient.sendTextMessage(
        userNum,
        `זוהי תזכורת לתפילת ${prayerHebName(
          schedule.prayer
        )} בשעה ${DateTime.fromISO(schedule.time).toFormat("HH:mm")} במניין ${
          minyan.name
        }

        האם תגיע?
        `
      );
      return;
    }

    await context.delete();
  },
  getNextStepId: async (userText: string, context: Context<UserContext>) => {
    const userContext = (await context.get())?.context;
    if (!userContext) {
      throw new Error("User context not found");
    }

    if (userContext.processSnoozed) {
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
    }

    throw new UnexpectedUserInputError(userText);
  },
};
