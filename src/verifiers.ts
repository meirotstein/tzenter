import { HandlerRequest } from "./handlers/types";
import crypto from "crypto";
import { UnauthorizedMessageError } from "./errors";

export function verifyWhatsappMessage(req: HandlerRequest) {
  const WA_APP_SECRET = process.env.WA_APP_SECRET;

  if (!WA_APP_SECRET) {
    throw new Error("WA_APP_SECRET is not defined");
  }

  const signature = req.headers?.["x-hub-signature-256"];
  if (!signature || typeof signature !== "string") {
    throw new UnauthorizedMessageError("Missing or invalid signature header");
  }

  const hmac = crypto.createHmac("sha256", WA_APP_SECRET);
  if (!req.body) {
    throw new UnauthorizedMessageError("Request body is missing");
  }
  hmac.update(
    typeof req.body === "string" ? req.body : JSON.stringify(req.body)
  );

  const expectedSignature = `sha256=${hmac.digest("hex")}`;
  if (signature !== expectedSignature) {
    console.warn("Invalid signature", signature, expectedSignature);
    // throw new UnauthorizedMessageError("Invalid signature");
  } else {
    console.log("Signature match!");
  }
}
