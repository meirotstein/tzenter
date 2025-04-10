import type { VercelRequest, VercelResponse } from "@vercel/node";
import { HandlerFactory } from "../handlers/HandlerFactory";
import { Endpoint } from "../handlers/types";
import { errorToHttpStatusCode } from "../utils";
import { verifyValidScheduleExecuter } from "../verifiers";

export default async (req: VercelRequest, res: VercelResponse) => {
  try {
    await verifyValidScheduleExecuter(req);
  } catch (e) {
    console.error("Failed to verify schedule message", e);
    return res.status(401).send("Unauthorized");
  }

  const factory = new HandlerFactory();
  const handler = factory.getHandler(Endpoint.ON_SCHEDULE, req.method);

  if (!handler) {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const response = await handler.handle(req);
    return res.status(200).send(response);
  } catch (e: any) {
    console.error("scheduled invocation failed", e);
    return res.status(errorToHttpStatusCode(e)).send(e.message);
  }
};
