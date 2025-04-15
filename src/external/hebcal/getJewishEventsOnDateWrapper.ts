import { Event } from "@hebcal/core";
import { execFile } from "child_process";
import path from "path";

export function getJewishEventsOnDateWrapper(date: Date): Promise<Event[]> {
  return new Promise<Event[]>((resolve, reject) => {
    const scriptPath = path.join(__dirname, "../../../scripts/get-daily-jewish-events.mjs");
    execFile(
      "node",
      [scriptPath, date.toISOString()],
      { shell: false },
      (error: any, stdout: any) => {
        if (error) return reject(error);
        try {
          const holidays = JSON.parse(stdout);
          resolve(holidays as Event[]);
        } catch (e) {
          reject(e);
        }
      }
    );
  });
}