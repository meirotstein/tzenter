import { HandlerRequest, HandlerResponse, IHandler } from "./types";

export class MessageHandler implements IHandler {
  handle(req: HandlerRequest): HandlerResponse {
    console.log("incoming message request", req.query);

    try {
      console.log(JSON.stringify(req.body));
    } catch (e) {
      console.log(req.body);
    }

    return { status: "Message received" };
  }
}
