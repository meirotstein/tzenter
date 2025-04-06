import { WhatsappClient } from "../clients/WhatsappClient";
import { Context, ContextType } from "../conversation/context";
import { notifyMinyanHasReachedStep } from "../conversation/steps/notifyMinyanHasReachedStep";
import { ScheduleContext, Step, UserContext } from "../conversation/types";
import { Schedule } from "../datasource/entities/Schedule";
import { getUserById } from "../datasource/usersRepository";
import { WATextMessage } from "../handlers/types";
import { calculatedAttendees } from "../utils";

export async function notifyAllIfNeeded(
  waClient: WhatsappClient,
  schedule: Schedule,
  context: Context<ScheduleContext>,
  initiatedByUserId?: string
): Promise<string> {
  const scheduleContext = await context.get();

  if (!scheduleContext) {
    console.log("skipping schedule - no context", {
      scheduleId: schedule.id,
      userId: initiatedByUserId,
    });
    return "skipped";
  }

  const minyan = schedule.minyan;

  if (!minyan) {
    throw new Error(`Minyan with id ${schedule.minyan.id} not found`);
  }

  const approved = scheduleContext?.approved || {};
  const amountOfApproved = calculatedAttendees(scheduleContext);

  if (amountOfApproved >= 10) {
    if (scheduleContext.notified) {
      if (initiatedByUserId) {
        const user = await getUserById(+initiatedByUserId);

        if (!user) {
          throw new Error(`User with id ${initiatedByUserId} not found`);
        }

        const userContext = Context.getContext<UserContext>(
          String(user.phone),
          ContextType.User
        );
        await userContext.set({
          currentStepId: notifyMinyanHasReachedStep.id,
          context: {
            schedule,
            minyan,
          },
        });

        await notifyMinyanHasReachedStep.action(
          +user.phone,
          waClient,
          {} as WATextMessage,
          userContext
        );
      }
    } else {
      const scheduleActions: Array<Promise<void>> = [];

      console.log("notifying messages for minyan", {
        minyanId: minyan.id,
        userLen: minyan.users?.length,
      });

      await context.update({
        notified: true,
      });

      for (const userId in approved) {
        const user = await getUserById(+userId);
        if (!user) {
          console.log("user not found, skipping", { userId });
          continue;
        }

        const userContext = Context.getContext<UserContext>(
          String(user.phone),
          ContextType.User
        );
        await userContext.set({
          currentStepId: notifyMinyanHasReachedStep.id,
          context: {
            schedule,
            minyan,
          },
        });
        scheduleActions.push(
          notifyMinyanHasReachedStep.action(
            +user.phone,
            waClient,
            {} as WATextMessage,
            userContext
          )
        );
      }

      await Promise.all(scheduleActions);
    }
  }

  return "done";
}
