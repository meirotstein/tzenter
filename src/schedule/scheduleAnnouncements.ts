import { Prayer, Schedule } from "../datasource/entities/Schedule";
import { getDailyEvents } from "../utils";
const { DateTime } = require("luxon");
export async function scheduleAnnouncements(
  schedule: Schedule,
  currentDate: Date
): Promise<string[]> {
  if (schedule.prayer === Prayer.Arvit) {
    const events = await getDailyEvents(currentDate);

    if (typeof events?.omerCount !== "number") {
      return [];
    }

    const omerDay = events.omerCount + 1;
    let omerWeeks = 0;
    let omerDays = 0;

    if (omerDay < 1) {
      return [];
    }

    if (omerDay >= 7) {
      omerWeeks = Math.floor(omerDay / 7);
      omerDays = omerDay % 7;
    }

    let omerMessage = `היום נספור ${omerDay} ימים`;
    if (omerWeeks > 0) {
      omerMessage += ` שהם ${omerWeeks} שבועות`;

      if (omerDays > 0) {
        omerMessage += ` ו${omerDays} ימים`;
      }
    }

    omerMessage += ` לעומר`;

    return [omerMessage];
  }

  return [];
}
