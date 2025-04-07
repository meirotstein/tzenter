import { WhatsappClient } from "../clients/WhatsappClient";
import { getInitScheduleStep, getProcessScheduleStep } from "../conversation";
import { Context, ContextType } from "../conversation/context";
import {
  ScheduleContext,
  ScheduleStatus,
  Step,
  UserContext,
} from "../conversation/types";
import { Schedule } from "../datasource/entities/Schedule";
import { getMinyanById } from "../datasource/minyansRepository";
import { WATextMessage } from "../handlers/types";
import { isAtLeastMinApart } from "../utils";

export async function invokeSchedule(
  waClient: WhatsappClient,
  schedule: Schedule,
  context: Context<ScheduleContext>
): Promise<string> {
  const scheduleInterval = +(
    process.env.SCHEDULE_INVOCATION_INTERVAL_MIN || 14
  );
  const scheduleContext = await context.get();
  const startedAt = Date.now();

  if (
    scheduleContext?.startedAt &&
    !isAtLeastMinApart(scheduleContext.startedAt, startedAt, scheduleInterval)
  ) {
    console.log("skipping schedule - didnt pass last process interval time", {
      startedAt,
      lastInterval: scheduleContext.startedAt,
      scheduleInterval,
    });
    return "skipped";
  }

  const minyan = await getMinyanById(schedule.minyan.id);

  if (!minyan) {
    throw new Error(`Minyan with id ${schedule.minyan.id} not found`);
  }

  const scheduleActions: Array<Promise<void>> = [];

  console.log("scheduling messages for minyan", {
    minyanId: minyan.id,
    userLen: minyan.users?.length,
  });

  for (const user of minyan.users ?? []) {
    let scheduleStep: Step;

    if (!scheduleContext?.status) {
      // initiate the schedule
      scheduleStep = getInitScheduleStep();
    } else {
      // schedule is already initiated
      scheduleStep = getProcessScheduleStep();
    }

    const userContext = Context.getContext<UserContext>(
      String(user.phone),
      ContextType.User
    );
    await userContext.set({
      currentStepId: scheduleStep.id,
      context: {
        schedule,
        minyan,
      },
    });
    scheduleActions.push(
      scheduleStep.action(
        +user.phone,
        waClient,
        {} as WATextMessage,
        userContext
      )
    );
  }

  await Promise.all(scheduleActions);

  const status = scheduleContext?.status
    ? ScheduleStatus.processing
    : ScheduleStatus.initiated;

  await context.update({
    status,
    startedAt,
  });

  return status;
}
