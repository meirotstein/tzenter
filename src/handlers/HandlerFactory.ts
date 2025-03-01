import { MessageHandler } from "./MessageHandler";
import { Endpoint, IHandler } from "../types/handlerTypes";
import { VerificationHandler } from "./VerificationHandler";

export class HandlerFactory {
  getHandler(endpoint: Endpoint, method?: string): IHandler | undefined {
    if (endpoint === Endpoint.ON_MESSAGE) {
      if (method === "POST") {
        return new MessageHandler();
      }
      if (method === "GET") {
        return new VerificationHandler();
      }
    }
  }
}
