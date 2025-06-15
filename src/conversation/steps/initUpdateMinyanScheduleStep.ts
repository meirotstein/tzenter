import { DateTime } from "luxon";
import { WhatsappClient } from "../../clients/WhatsappClient";
import { Schedule } from "../../datasource/entities/Schedule";
import { getScheduleById } from "../../datasource/scheduleRepository";
import { getUserByPhone } from "../../datasource/usersRepository";
import { UnexpectedUserInputError } from "../../errors";
import { WATextMessage } from "../../handlers/types";
import { hasScheduleTimePassed } from "../../schedule/scheduleTimeUtils";
import { prayerHebName } from "../../utils";
import { noWords, yesWords } from "../consts";
import { Context, ContextType } from "../context";
import { getMessage, messages } from "../messageTemplates";
import { ScheduleContext, Step, UserContext } from "../types";
import { approveScheduleStep } from "./approveScheduleStep";
import { rejectScheduleStep } from "./rejectScheduleStep";
import { sendScheduleStatusStep } from "./sendScheduleStatusStep";
import { updateScheduleAttendeesStep } from "./updateScheduleAttendeesStep";

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
      const ctxData = await ctx.get();

      if (!ctxData || hasScheduleTimePassed(ctxData, 5)) {
        console.log("schedule time has already passed", {
          userNum,
          scheduleId: ctx.id,
          scheduleTime: ctxData?.calculatedHour || "unknown",
        });
        continue;
      }

      const scheduleEntity = await getScheduleById(+ctx.id);

      if (!scheduleEntity) {
        throw new Error(`Schedule not found, id: ${ctx.id}`);
      }

      if (!user?.minyans?.find((m) => m.id === scheduleEntity.minyan.id)) {
        console.log("user is not registered to this minyan", {
          userNum,
          scheduleId: ctx.id,
          minyanId: scheduleEntity.minyan.id,
        });
        continue;
      }

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
      const params: any = {
        activeCount: userSchedules.length,
        schedules: [],
        actions: [],
      };

      const contextData = [];

      for (const schedule of userSchedules) {
        params.schedules.push({
          prayer: prayerHebName(schedule.entity.prayer),
          minyan: schedule.entity.minyan.name,
          time:
            schedule.data?.calculatedHour ||
            DateTime.fromISO(schedule.entity.time).toFormat("HH:mm"),
        });
        if (schedule.isApproved) {
          params.actions.push({
            actionType: "status",
            prayer: prayerHebName(schedule.entity.prayer),
            minyan: schedule.entity.minyan.name,
            time:
              schedule.data?.calculatedHour ||
              DateTime.fromISO(schedule.entity.time).toFormat("HH:mm"),
          });
          contextData.push({
            schedule: schedule.entity,
            actionType: "status",
          });
        }
        params.actions.push({
          actionType: "presence",
          prayer: prayerHebName(schedule.entity.prayer),
          minyan: schedule.entity.minyan.name,
          time:
            schedule.data?.calculatedHour ||
            DateTime.fromISO(schedule.entity.time).toFormat("HH:mm"),
        });
        contextData.push({
          schedule: schedule.entity,
          actionType: "presence",
        });
      }

      await context.update({
        context: contextData,
      });

      await waClient.sendTextMessage(
        userNum,
        getMessage(messages.MULTIPLE_ACTIVE_SCHEDULES, params)
      );
      return;
    }

    // single schedule
    const userSchedule = userSchedules[0];

    const contextData = [];

    if (userSchedule.isApproved) {
      contextData.push({
        schedule: userSchedule.entity,
        actionType: "status",
      });
    }
    contextData.push({
      schedule: userSchedule.entity,
      actionType: "presence",
    });

    await context.update({
      context: contextData,
    });

    await waClient.sendTextMessage(
      userNum,
      getMessage(
        userSchedule.isApproved
          ? messages.ACTIVE_SCHEDULE_USER_APPROVED
          : messages.ACTIVE_SCHEDULE_USER_NOT_APPROVED,
        {
          minyanName: userSchedule.entity.minyan.name,
          hour:
            userSchedule.data?.calculatedHour ||
            DateTime.fromISO(userSchedule.entity.time).toFormat("HH:mm"),
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

    if (
      userContext?.context?.length === 1 &&
      userContext.context[0].actionType === "presence"
    ) {
      await context.update({
        context: {
          schedule: userContext.context[0].schedule,
        },
      });
      if (yesWords.includes(userText)) {
        return approveScheduleStep.id;
      }
      if (noWords.includes(userText)) {
        return rejectScheduleStep.id;
      }
    }

    const userIndexSelection = Number(userText);

    if (!userIndexSelection || isNaN(userIndexSelection)) {
      console.log(
        "initUpdateMinyanScheduleStep: userText is not a number - aborting",
        userText
      );
      return Promise.reject(new UnexpectedUserInputError(userText));
    }

    const selectionContext = userContext?.context?.[userIndexSelection - 1];

    if (!selectionContext) {
      console.log(
        "initUpdateMinyanScheduleStep: userText selection not found - aborting",
        userText
      );
      return Promise.reject(new UnexpectedUserInputError(userText));
    }

    const schedule = selectionContext.schedule;
    await context.update({
      context: {
        schedule,
      },
    });

    if (selectionContext.actionType === "status") {
      return Promise.resolve(sendScheduleStatusStep.id);
    }

    if (selectionContext.actionType === "presence") {
      return Promise.resolve(updateScheduleAttendeesStep.id);
    }

    return Promise.reject(new UnexpectedUserInputError(userText));
  },
};
