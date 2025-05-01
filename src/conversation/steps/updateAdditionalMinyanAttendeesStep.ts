import { WhatsappClient } from "../../clients/WhatsappClient";
import { Schedule } from "../../datasource/entities/Schedule";
import { WATextMessage } from "../../handlers/types";
import { notifyIfMinyanReached } from "../../schedule/notifyIfMinyanReached";
import { Context, ContextType } from "../context";
import { messages } from "../messageTemplates";
import { ScheduleContext, Step, UserContext } from "../types";

export const updateAdditionalMinyanAttendeesStep: Step = {
  id: "updateAdditionalMinyanAttendeesStep",
  action: async (
    userNum: number,
    waClient: WhatsappClient,
    message: WATextMessage,
    context: Context<UserContext>
  ) => {
    const userContext = (await context.get())?.context;
    if (!userContext?.minyan || !userContext?.schedule) {
      throw new Error("Minyan or schedule not found in context");
    }

    const schedule: Schedule = userContext.schedule;

    const scheduleContext = Context.getContext<ScheduleContext>(
      String(schedule.id),
      ContextType.Schedule
    );

    if (!scheduleContext) {
      throw new Error("Schedule context not found");
    }

    const expectedSelection = Number(message.message);
    if (isNaN(expectedSelection)) {
      console.log(
        "updateAdditionalMinyanAttendeesStep: userText is not a unexpected"
      );
      throw new Error(`userText is not a unexpected: ${message.message}`);
    }

    // TODO: might need to use a mutex-like functions for that kind of update
    const scheduleContextData = await scheduleContext.get();

    const approved = scheduleContextData?.approved || {};

    approved[String(userNum)] = expectedSelection;

    const forUpdate: Partial<ScheduleContext> = {
      approved,
    };

    await scheduleContext.update(forUpdate);

    await waClient.sendTextMessage(
      userNum,
      messages.ATTENDEES_AMOUNT_UPDATE_ACCEPTED
    );
    await notifyIfMinyanReached(
      waClient,
      schedule,
      scheduleContext,
      String(userNum)
    );

    await context.delete();

    console.log("user updated schedule", { userNum, scheduleId: schedule.id });
  },
  getNextStepId: async (userText: string, context: Context<UserContext>) =>
    Promise.resolve(undefined),
};
