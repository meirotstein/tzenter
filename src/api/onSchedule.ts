import type { VercelRequest, VercelResponse } from "@vercel/node";
import { HandlerFactory } from "../handlers/HandlerFactory";
import { Endpoint } from "../handlers/types";
import { errorToHttpStatusCode } from "../utils";
import { verifyWhatsappMessage } from "../verifiers";

module.exports = async (req: VercelRequest, res: VercelResponse) => {
  // await verifyWhatsappMessage(req);  // TODO: verify cron message

  const factory = new HandlerFactory();
  const handler = factory.getHandler(Endpoint.ON_SCHEDULE, req.method);

  if (!handler) {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const response = await handler.handle(req);
    return res.status(200).send(response);
  } catch (e: any) {
    return res.status(errorToHttpStatusCode(e)).send(e.message);
  }
};
