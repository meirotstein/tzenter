import type { VercelRequest, VercelResponse } from "@vercel/node";
// import { getHolidaysOnDate } from "@hebcal/core";

module.exports = async (req: VercelRequest, res: VercelResponse) => {
  async function getHebrewHolidays(date: Date, il = true) {
    const { getHolidaysOnDate } = await import("@hebcal/core/dist/esm/holidays");
    return getHolidaysOnDate(date, il);
  }

  try {
    const hebHolidays = await getHebrewHolidays(new Date())
    console.log("Hebrew holidays", hebHolidays);
    return res.status(200).send(hebHolidays?.length);
  } catch (e: any) {
    console.error("scheduled invocation failed", e);
    return res.status(500).send(e.message);
  }
};
