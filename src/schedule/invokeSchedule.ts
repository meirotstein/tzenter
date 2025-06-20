import { v4 as uuidv4 } from "uuid";
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
import { ScheduleOccurrence } from "../datasource/entities/ScheduleOccurrence";
import { getMinyanById } from "../datasource/minyansRepository";
import {
  getScheduleInvocationOccurrence,
  saveScheduleOccurrence,
} from "../datasource/scheduleOccurrencesRepository";
import { WATextMessage } from "../handlers/types";
import {
  calculatedAttendees,
  isAtLeastMinApart,
  isLastExecution,
} from "../utils";

export async function invokeSchedule(
  waClient: WhatsappClient,
  schedule: Schedule,
  context: Context<ScheduleContext>
): Promise<string> {
  const scheduleInterval = +(
    process.env.SCHEDULE_INVOCATION_INTERVAL_MIN || 14
  );
  const scheduleContext = await context.get();
  const invocationId = scheduleContext?.invocationId || uuidv4();
  const updatedAt = Date.now();

  if (
    scheduleContext?.updatedAt &&
    !isAtLeastMinApart(scheduleContext.updatedAt, updatedAt, scheduleInterval)
  ) {
    console.log("skipping schedule - didnt pass last process interval time", {
      updatedAt,
      lastInterval: scheduleContext.updatedAt,
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
    invocationId,
    status,
    updatedAt,
    startedAt: scheduleContext?.startedAt || Date.now(),
  });

  const scheduleHour = scheduleContext?.calculatedHour || schedule.time;

  if (isLastExecution(scheduleHour, scheduleInterval) && scheduleContext) {
    const scheduleOccurrence =
      (await getScheduleInvocationOccurrence(invocationId)) ||
      new ScheduleOccurrence();
    scheduleOccurrence.datetime = new Date();
    scheduleOccurrence.scheduleId = schedule.id;
    scheduleOccurrence.approved = calculatedAttendees(scheduleContext);
    scheduleOccurrence.rejected = (scheduleContext.rejected || []).length;
    scheduleOccurrence.snoozed = (scheduleContext.snoozed || []).length;
    scheduleOccurrence.invocationId = invocationId;
    await saveScheduleOccurrence(scheduleOccurrence);
  }

  return status;
}
