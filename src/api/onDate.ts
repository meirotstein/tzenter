import type { VercelRequest, VercelResponse } from "@vercel/node";
import { shouldSkipScheduleToday } from "../utils";

module.exports = async (req: VercelRequest, res: VercelResponse) => {
  try {
    const shouldSkip = await shouldSkipScheduleToday(new Date());
    console.log({ shouldSkip });
    return res.status(200).send(shouldSkip);
  } catch (e: any) {
    console.error("scheduled invocation failed", e);
    return res.status(500).send(e.message);
  }
};
