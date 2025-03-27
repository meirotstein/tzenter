import { WhatsappClient } from "../clients/WhatsappClient";
import { HandlerRequest, HandlerResponse, IHandler } from "./types";

export class ScheduleHandler implements IHandler {
  private waClient: WhatsappClient;

  constructor() {
    this.waClient = new WhatsappClient(Number(process.env.WA_PHONE_NUMBER_ID));
  }

  async handle(req: HandlerRequest): Promise<HandlerResponse> {
    console.log("schedule messages started", {
      time: new Date().toISOString(),
    });

    // Impl

    console.log("schedule messages ended", {
      time: new Date().toISOString(),
    });

    return { status: "success" }; // TODO: return schedule stats
  }
}
