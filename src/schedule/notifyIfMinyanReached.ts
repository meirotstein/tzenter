import { WhatsappClient } from "../clients/WhatsappClient";
import { Context, ContextType } from "../conversation/context";
import { notifyMinyanHasReachedStep } from "../conversation/steps/notifyMinyanHasReachedStep";
import { ScheduleContext, UserContext } from "../conversation/types";
import { Schedule } from "../datasource/entities/Schedule";
import { ScheduleOccurrence } from "../datasource/entities/ScheduleOccurrence";
import {
  getScheduleOccurrencesByScheduleId,
  saveScheduleOccurrence,
} from "../datasource/scheduleOccurrencesRepository";
import { getUserByPhone } from "../datasource/usersRepository";
import { WATextMessage } from "../handlers/types";
import { calculatedAttendees } from "../utils";

export async function notifyIfMinyanReached(
  waClient: WhatsappClient,
  schedule: Schedule,
  context: Context<ScheduleContext>,
  initiatedByUserNum?: string
): Promise<string> {
  const scheduleContext = await context.get();

  if (!scheduleContext) {
    console.log("skipping schedule - no context", {
      scheduleId: schedule.id,
      userNum: initiatedByUserNum,
    });
    return "skipped";
  }

  const minyan = schedule.minyan;

  if (!minyan) {
    throw new Error("Minyan with not found");
  }

  const approved = scheduleContext?.approved || {};
  const amountOfApproved = calculatedAttendees(scheduleContext);

  if (amountOfApproved >= 10) {
    if (scheduleContext.notified) {
      if (initiatedByUserNum) {
        const user = await getUserByPhone(initiatedByUserNum);

        if (!user) {
          throw new Error(`User with id ${initiatedByUserNum} not found`);
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

      for (const userNum in approved) {
        const user = await getUserByPhone(userNum);
        if (!user) {
          console.log("user not found, skipping", { userId: userNum });
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

    // const scheduleOccurrence =
    //   (await getScheduleOccurrencesByScheduleId(schedule.id)) ||
    //   new ScheduleOccurrence();
    // scheduleOccurrence.datetime = new Date();
    // scheduleOccurrence.scheduleId = schedule.id;
    // scheduleOccurrence.approved = amountOfApproved;
    // scheduleOccurrence.rejected = (scheduleContext.rejected || []).length;
    // scheduleOccurrence.snoozed = (scheduleContext.snoozed || []).length;
    // await saveScheduleOccurrence(scheduleOccurrence);
  }

  return "done";
}
