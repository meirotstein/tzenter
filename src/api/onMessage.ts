import type { VercelRequest, VercelResponse } from "@vercel/node";
import getRawBody from "raw-body";
import { HandlerFactory } from "../handlers/HandlerFactory";
import { Endpoint } from "../handlers/types";
import { errorToHttpStatusCode } from "../utils";
import { verifyWhatsappMessage } from "../verifiers";

function getRequestRawBody(req: VercelRequest) {
  if (typeof req.body === "string") {
    return req.body;
  }

  if (Buffer.isBuffer(req.body)) {
    return req.body.toString("utf8");
  }

  if (req.body && typeof req.body === "object") {
    return JSON.stringify(req.body);
  }

  return getRawBody(req).then((body) => body.toString("utf8"));
}

const onMessage = async (req: VercelRequest, res: VercelResponse) => {
  try {
    if (req.method === "POST") {
      const rawBody = await getRequestRawBody(req);
      await verifyWhatsappMessage(req, rawBody);

      if (!req.body || typeof req.body !== "object" || Buffer.isBuffer(req.body)) {
        req.body = JSON.parse(rawBody);
      }
    } else {
      await verifyWhatsappMessage(req);
    }
  } catch (e) {
    console.error("Failed to verify WhatsApp message", e);
    return res.status(401).send("Unauthorized");
  }

  const factory = new HandlerFactory();
  const handler = factory.getHandler(Endpoint.ON_MESSAGE, req.method);

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

export default onMessage;
