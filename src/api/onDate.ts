import type { VercelRequest, VercelResponse } from "@vercel/node";
import { execFile } from "child_process";
import path from "path";
// import { getHolidaysOnDate } from "@hebcal/core";

// const { execFile } = require("child_process");
// const path = require("path");

function getJewishEventsOnDateWrapper(date: Date): any {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, "../../scripts/get-daily-jewish-events.mjs");
    execFile(
      "node",
      [scriptPath, date.toISOString()],
      { shell: false },
      (error: any, stdout: any) => {
        if (error) return reject(error);
        try {
          const holidays = JSON.parse(stdout);
          resolve(holidays);
        } catch (e) {
          reject(e);
        }
      }
    );
  });
}

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
