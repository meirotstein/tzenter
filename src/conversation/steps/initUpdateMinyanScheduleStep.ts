import { DateTime } from "luxon";
import { WhatsappClient } from "../../clients/WhatsappClient";
import { getScheduleById } from "../../datasource/scheduleRepository";
import { UnexpectedUserInputError } from "../../errors";
import { WATextMessage } from "../../handlers/types";
import { prayerHebName } from "../../utils";
import { Context, ContextType } from "../context";
import { getMessage, messages } from "../messageTemplates";
import { ScheduleContext, Step, UserContext } from "../types";
import { sendScheduleStatusStep } from "./sendScheduleStatusStep";

const expectedUserResponses = {
  getUpdate: "1",
  performUpdate: "2",
};

export const initUpdateMinyanScheduleStep: Step = {
  id: "initUpdateMinyanScheduleStep",
  action: async (
    userNum: number,
    waClient: WhatsappClient,
    message: WATextMessage,
    context: Context<UserContext>
  ) => {
    const scheduleContexts = await Context.getAllContexts<ScheduleContext>(
      ContextType.Schedule
    );
    const userSchedules: Array<{ id: string; data: ScheduleContext }> = [];

    for (const ctx of scheduleContexts) {
      const ctxData = await ctx.get();
      if (
        ctxData?.approved &&
        Object.keys(ctxData.approved).includes(String(userNum))
      ) {
        userSchedules.push({ id: ctx.id, data: ctxData });
      }
    }

    if (userSchedules.length === 0) {
      await waClient.sendTextMessage(userNum, messages.NO_ACTIVE_SCHEDULE);
      return;
    }

    if (userSchedules.length > 1) {
      await waClient.sendTextMessage(
        userNum,
        messages.MULTIPLE_ACTIVE_SCHEDULE_REJECT
      );
      return;
    }

    const scheduleEntity = await getScheduleById(+userSchedules[0].id);

    if (!scheduleEntity) {
      throw new Error(`Schedule not found, id: ${userSchedules[0].id}`);
    }

    await context.update({
      context: {
        scheduleId: scheduleEntity.id,
      },
    });

    await waClient.sendTextMessage(
      userNum,
      getMessage(messages.ACTIVE_SCHEDULE_SINGLE, {
        minyanName: scheduleEntity.minyan.name,
        hour: DateTime.fromISO(scheduleEntity.time).toFormat("HH:mm"),
        pray: prayerHebName(scheduleEntity.prayer),
      })
    );

    console.log("user is updating existing schedule", {
      userNum,
      scheduleId: scheduleEntity.id,
    });
  },
  getNextStepId: async (userText: string, context: Context<UserContext>) => {
    console.log(
      "received userText on initUpdateMinyanScheduleStep.getNextStepId",
      userText
    );
    if (userText === expectedUserResponses.getUpdate) {
      return Promise.resolve(sendScheduleStatusStep.id);
    }
    // else if (userText === expectedUserResponses.performUpdate) {
    //   return Promise.resolve(updateScheduleAttendeesStep.id);
    // }
    return Promise.reject(new UnexpectedUserInputError(userText));
  },
};
