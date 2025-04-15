import { Event } from "@hebcal/core";
import { execFile } from "child_process";
import path from "path";

const cache: Record<string, Event[]> = {};

export function getJewishEventsOnDateWrapper(date: Date): Promise<Event[]> {
  return new Promise<Event[]>((resolve, reject) => {
    const dateStr = date.toISOString();
    if (cache[dateStr]) {
      console.log("cache hit", dateStr);
      return resolve(cache[dateStr]);
    }
    const scriptPath = path.join(
      __dirname,
      "../../../scripts/get-daily-jewish-events.mjs"
    );
    execFile(
      "node",
      [scriptPath, date.toISOString()],
      { shell: false },
      (error: any, stdout: any) => {
        if (error) return reject(error);
        try {
          const holidays = JSON.parse(stdout);
          cache[dateStr] = holidays;
          resolve(holidays as Event[]);
        } catch (e) {
          reject(e);
        }
      }
    );
  });
}
