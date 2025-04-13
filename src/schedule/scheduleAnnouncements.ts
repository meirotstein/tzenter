import { Prayer, Schedule } from "../datasource/entities/Schedule";
const { DateTime } = require("luxon");
export function scheduleAnnouncements(
  schedule: Schedule,
  currentDate: Date
): string[] {
  if (schedule.prayer === Prayer.Arvit) {
    const firstOmerDate = DateTime.fromISO("2025-04-13"); // first omer date
    const today = DateTime.fromJSDate(currentDate);
    const daysPassed = Math.floor(today.diff(firstOmerDate, "days").days);
    const omerDay = daysPassed + 1;
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
