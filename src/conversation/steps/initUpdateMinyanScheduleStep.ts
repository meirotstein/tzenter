import { DateTime } from "luxon";
import { WhatsappClient } from "../../clients/WhatsappClient";
import { Schedule } from "../../datasource/entities/Schedule";
import { getScheduleById } from "../../datasource/scheduleRepository";
import { getUserByPhone } from "../../datasource/usersRepository";
import { UnexpectedUserInputError } from "../../errors";
import { WATextMessage } from "../../handlers/types";
import { prayerHebName } from "../../utils";
import { noWords, yesWords } from "../consts";
import { Context, ContextType } from "../context";
import { getMessage, messages } from "../messageTemplates";
import { ScheduleContext, Step, UserContext } from "../types";
import { approveScheduleStep } from "./approveScheduleStep";
import { rejectScheduleStep } from "./rejectScheduleStep";
import { sendScheduleStatusStep } from "./sendScheduleStatusStep";
import { updateScheduleAttendeesStep } from "./updateScheduleAttendeesStep";

const expectedUserResponsesWhenApproved = {
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
    const userSchedules: Array<{
      id: string;
      data: ScheduleContext | null;
      entity: Schedule;
      isApproved: boolean;
    }> = [];

    const user = await getUserByPhone(String(userNum));

    for (const ctx of scheduleContexts) {
      const scheduleEntity = await getScheduleById(+ctx.id);

      if (!scheduleEntity) {
        throw new Error(`Schedule not found, id: ${ctx.id}`);
      }

      if (DateTime.fromISO(scheduleEntity.time) < DateTime.now()) {
        console.log("schedule time has already passed", {
          userNum,
          scheduleId: ctx.id,
          scheduleTime: scheduleEntity.time,
        });
        continue;
      }

      if (!user?.minyans?.find((m) => m.id === scheduleEntity.minyan.id)) {
        console.log("user is not registered to this minyan", {
          userNum,
          scheduleId: ctx.id,
          minyanId: scheduleEntity.minyan.id,
        });
        continue;
      }

      const ctxData = await ctx.get();
      const userSchedule = {
        id: ctx.id,
        data: ctxData ? { ...ctxData } : null,
        entity: { ...scheduleEntity },
        isApproved: false,
      };

      if (
        ctxData?.approved &&
        Object.keys(ctxData.approved).includes(String(userNum))
      ) {
        userSchedule.isApproved = true;
      }
      userSchedules.push(userSchedule);
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

    const userSchedule = userSchedules[0];

    await context.update({
      context: {
        schedule: userSchedule.entity,
        isApproved: userSchedule.isApproved,
      },
    });

    await waClient.sendTextMessage(
      userNum,
      getMessage(
        userSchedule.isApproved
          ? messages.ACTIVE_SCHEDULE_USER_APPROVED
          : messages.ACTIVE_SCHEDULE_USER_NOT_APPROVED,
        {
          minyanName: userSchedule.entity.minyan.name,
          hour: DateTime.fromISO(userSchedule.entity.time).toFormat("HH:mm"),
          pray: prayerHebName(userSchedule.entity.prayer),
        }
      )
    );

    console.log("user is updating existing schedule", {
      userNum,
      scheduleId: userSchedule.entity.id,
    });
  },
  getNextStepId: async (userText: string, context: Context<UserContext>) => {
    console.log(
      "received userText on initUpdateMinyanScheduleStep.getNextStepId",
      userText
    );
    const userContext = await context.get();

    if (userContext?.context?.isApproved) {
      if (userText === expectedUserResponsesWhenApproved.getUpdate) {
        return Promise.resolve(sendScheduleStatusStep.id);
      } else if (userText === expectedUserResponsesWhenApproved.performUpdate) {
        return Promise.resolve(updateScheduleAttendeesStep.id);
      }
    }

    if (!userContext?.context?.isApproved) {
      if (yesWords.includes(userText)) {
        return approveScheduleStep.id;
      }
      if (noWords.includes(userText)) {
        return rejectScheduleStep.id;
      }
    }

    return Promise.reject(new UnexpectedUserInputError(userText));
  },
};
