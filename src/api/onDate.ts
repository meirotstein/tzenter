import type { VercelRequest, VercelResponse } from "@vercel/node";
// import { getHolidaysOnDate } from "@hebcal/core";

module.exports = async (req: VercelRequest, res: VercelResponse) => {
  async function getHebrewHolidays(date: Date, il = true) {
    const { getHolidaysOnDate } = await import("@hebcal/core");
    return getHolidaysOnDate(date, il);
  }

  try {
    return res.status(200).send(getHebrewHolidays(new Date()));
  } catch (e: any) {
    console.error("scheduled invocation failed", e);
    return res.status(500).send(e.message);
  }
};
