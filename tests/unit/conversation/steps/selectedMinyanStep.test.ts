import { DateTime } from "luxon";
import { Prayer } from "../../../../src/datasource/entities/Schedule";
import {
  formatNextMinyanScheduleText,
  NextMinyanSchedule,
} from "../../../../src/conversation/steps/selectedMinyanStep";

function buildNextSchedule(iso: string, prayer: Prayer): NextMinyanSchedule {
  return {
    calculatedTime: DateTime.fromISO(iso, { zone: "Asia/Jerusalem" }),
    schedule: {
      prayer,
    } as any,
  };
}

describe("formatNextMinyanScheduleText", () => {
  it("returns the no-future text when there is no upcoming schedule", () => {
    expect(formatNextMinyanScheduleText(undefined)).toBe("אין תזמונים עתידיים");
  });

  it("formats same-day schedules as today", () => {
    expect(
      formatNextMinyanScheduleText(
        buildNextSchedule("2026-04-05T13:25:00+03:00", Prayer.Mincha),
        new Date("2026-04-05T09:00:00+03:00")
      )
    ).toBe("היום בשעה 13:25 - תפילת מנחה");
  });

  it("formats next-day schedules as tomorrow", () => {
    expect(
      formatNextMinyanScheduleText(
        buildNextSchedule("2026-04-06T08:30:00+03:00", Prayer.Shacharit),
        new Date("2026-04-05T23:30:00+03:00")
      )
    ).toBe("מחר בשעה 08:30 - תפילת שחרית");
  });

  it("formats later schedules with the calendar date", () => {
    expect(
      formatNextMinyanScheduleText(
        buildNextSchedule("2026-05-13T20:10:00+03:00", Prayer.Arvit),
        new Date("2026-05-10T09:00:00+03:00")
      )
    ).toBe("13/5/2026 בשעה 20:10 - תפילת ערבית");
  });
});
