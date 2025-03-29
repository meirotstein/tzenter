import { WhatsappClient } from "../clients/WhatsappClient";
import { Context, ContextType } from "../conversation/context";
import { handleSchedule } from "../conversation/scheduledMessages";
import { ScheduleContext } from "../conversation/types";
import {
  getScheduleById,
  getUpcomingSchedules,
} from "../datasource/scheduleRepository";
import { HandlerRequest, HandlerResponse, IHandler } from "./types";

const oneHourInMinutes = 60;

export class ScheduleHandler implements IHandler {
  private waClient: WhatsappClient;

  constructor() {
    this.waClient = new WhatsappClient(Number(process.env.WA_PHONE_NUMBER_ID));
  }

  async handle(req: HandlerRequest): Promise<HandlerResponse> {
    console.log("schedule messages started", {
      time: new Date().toISOString(),
    });

    const nextSchedules = await getUpcomingSchedules(oneHourInMinutes);

    console.log("next relevant schedules", nextSchedules.length);

    const scheduleActions: Array<Promise<string>> = [];
    for (const upcomingSchedule of nextSchedules) {
      const context: Context<ScheduleContext> =
        Context.getContext<ScheduleContext>(
          String(upcomingSchedule.id),
          ContextType.Schedule
        );
      const schedule = await getScheduleById(upcomingSchedule.id);
      scheduleActions.push(handleSchedule(this.waClient, schedule!, context));
    }

    const statuses = await Promise.all(scheduleActions);

    console.log("schedule messages ended", {
      statuses,
      time: new Date().toISOString(),
    });

    return { status: "done" };
  }
}
