import type { VercelRequest, VercelResponse } from "@vercel/node";
import { HandlerFactory } from "../handlers/HandlerFactory";
import { Endpoint } from "../types/handlerTypes";
import { errorToHttpStatusCode } from "../utils";

module.exports = async (req: VercelRequest, res: VercelResponse) => {
  const factory = new HandlerFactory();
  const handler = factory.getHandler(Endpoint.ON_MESSAGE, req.method);

  if (!handler) {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const response = await handler.handle(req);
    return res.status(200).send(response);
  } catch (e) {
    return res.status(errorToHttpStatusCode(e)).send(e.message);
  }
};
