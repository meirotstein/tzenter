import { BadInputError, InvalidInputError } from "../errors";
import { HandlerRequest, HandlerResponse, IHandler } from "./types";

export class VerificationHandler implements IHandler {
  async handle(req: HandlerRequest): Promise<HandlerResponse> {
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
    return Promise.resolve(req.query["hub.challenge"]);
  }
}
