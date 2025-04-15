import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getJewishEventsOnDateWrapper } from "../external/hebcal/getJewishEventsOnDateWrapper";

module.exports = async (req: VercelRequest, res: VercelResponse) => {
  try {
    const hebHolidays = await getJewishEventsOnDateWrapper(new Date());
    console.log("Hebrew holidays", hebHolidays);
    return res.status(200).send(hebHolidays?.length);
  } catch (e: any) {
    console.error("scheduled invocation failed", e);
    return res.status(500).send(e.message);
  }
};
