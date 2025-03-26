import { HandlerRequest } from "./handlers/types";
import crypto from "crypto";
import getRawBody from "raw-body";
import { IncomingMessage } from "http";
import { UnauthorizedMessageError } from "./errors";

export async function verifyWhatsappMessage(
  req: IncomingMessage & { headers: any }
) {
  if (req.method !== "POST") {
    return;
  }
  const WA_APP_SECRET = process.env.WA_APP_SECRET;

  if (!WA_APP_SECRET) {
    throw new Error("WA_APP_SECRET is not defined");
  }

  const signature = req.headers?.["x-hub-signature-256"];
  if (!signature || typeof signature !== "string") {
    throw new UnauthorizedMessageError("Missing or invalid signature header");
  }

  const hmac = crypto.createHmac("sha256", WA_APP_SECRET);

  const rawBody = (await getRawBody(req)).toString("utf8");
  hmac.update(rawBody);

  const expectedSignature = `sha256=${hmac.digest("hex")}`;
  if (signature !== expectedSignature) {
    console.warn("Invalid signature", signature, expectedSignature);
    // throw new UnauthorizedMessageError("Invalid signature");
  } else {
    console.log("Signature match!");
  }
}
