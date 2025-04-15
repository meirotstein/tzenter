import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getHolidaysOnDate } from "@hebcal/core";

module.exports = async (req: VercelRequest, res: VercelResponse) => {


  try {
    return res.status(200).send('getHolidaysOnDate(new Date())');
  } catch (e: any) {
    console.error("scheduled invocation failed", e);
    return res.status(500).send(e.message);
  }
};
