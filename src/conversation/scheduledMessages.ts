import { getInitScheduleStep, getProcessScheduleStep } from ".";
import {
  ScheduleContext,
  UserContext,
} from "../../.vercel/output/static/src/conversation/types";
import { WhatsappClient } from "../clients/WhatsappClient";
import { Schedule } from "../datasource/entities/Schedule";
import { getMinyanById } from "../datasource/minyansRepository";
import { Context, ContextType } from "./context";
import { ScheduleStatus, Step } from "./types";

export async function handleSchedule(
  waClient: WhatsappClient,
  schedule: Schedule,
  context: Context<ScheduleContext>
): Promise<string> {
  const scheduleContext = await context.get();

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

    if (scheduleContext?.status === ScheduleStatus.initiated) {
      // schedule is already initiated
      scheduleStep = getProcessScheduleStep();
    } else {
      // initiate the schedule
      scheduleStep = getInitScheduleStep();
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
      scheduleStep.action(+user.phone, waClient, "", userContext)
    );
  }

  await Promise.all(scheduleActions);

  const status = scheduleContext?.status
    ? ScheduleStatus.processing
    : ScheduleStatus.initiated;

  await context.set({
    status,
  });

  return status;
}
