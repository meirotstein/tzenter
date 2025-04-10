import { WhatsappClient } from "../clients/WhatsappClient";
import { Context, ContextType } from "../conversation/context";
import { ScheduleContext } from "../conversation/types";
import {
  getScheduleById,
  getUpcomingSchedules,
} from "../datasource/scheduleRepository";
import { invokeSchedule } from "../schedule/invokeSchedule";
// import { shouldSkipScheduleToday } from "../utils";
import { HandlerRequest, HandlerResponse, IHandler } from "./types";

const oneHourInMinutes = 60;
const schedulePeriod = +(
  process.env.SCHEDULE_INVOCATION_START_MIN || oneHourInMinutes
);

export class ScheduleHandler implements IHandler {
  private waClient: WhatsappClient;

  constructor() {
    this.waClient = new WhatsappClient(Number(process.env.WA_PHONE_NUMBER_ID));
  }

  async handle(req: HandlerRequest): Promise<HandlerResponse> {
    const today = new Date();
    console.log("schedule messages started", {
      time: today.toISOString(),
    });

    // if (shouldSkipScheduleToday(today)) {
    //   console.log("skipping schedule today");
    //   return { status: "skipped" };
    // }

    const nextSchedules = await getUpcomingSchedules(schedulePeriod);

    console.log("next relevant schedules", nextSchedules.length);

    const scheduleInvocations: Array<Promise<string>> = [];
    for (const upcomingSchedule of nextSchedules) {
      const context: Context<ScheduleContext> =
        Context.getContext<ScheduleContext>(
          String(upcomingSchedule.id),
          ContextType.Schedule
        );
      const schedule = await getScheduleById(upcomingSchedule.id);
      scheduleInvocations.push(
        invokeSchedule(this.waClient, schedule!, context)
      );
    }

    const statuses = await Promise.all(scheduleInvocations);

    console.log("schedule messages ended", {
      statuses,
      time: new Date().toISOString(),
    });

    return { status: "done", schedules: scheduleInvocations.length };
  }
}
