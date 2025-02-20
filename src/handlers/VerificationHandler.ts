import { BadInputError, InvalidInputError } from "../errors";
import { HandlerRequest, HandlerResponse, IHandler } from "./types";

export class VerificationHandler implements IHandler {
  handle(req: HandlerRequest): HandlerResponse {
    console.log("verification request", req.query);

    if (!req.query || !req.query["hub.challenge"]) {
      throw new BadInputError("verification data is required");
    }

    if (
      req.query["hub.mode"] !== "subscribe" ||
      req.query["hub.verify_token"] !== process.env.VERCEL_VERIFY_TOKEN
    ) {
      throw new InvalidInputError("verification data is invalid");
    }
    return req.query["hub.challenge"];
  }
}
