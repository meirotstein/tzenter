import { Prayer, WeekDay } from "../../../src/datasource/entities/Schedule";
import { saveMinyan, getRepo as getMinyanRepo } from "../../../src/datasource/minyansRepository";
import {
  addSchedule,
  getRepo as getScheduleRepo,
} from "../../../src/datasource/scheduleRepository";
import { getNextMinyanSchedule } from "../../../src/schedule/getNextMinyanSchedule";

describe("getNextMinyanSchedule", () => {
  afterEach(async () => {
    await (await getScheduleRepo()).clear();
    await (await getMinyanRepo()).clear();
  });

  it("formats the next schedule as today when the next occurrence is later the same day", async () => {
    const minyan = await saveMinyan({
      name: "איצקוביץ",
      city: "תל אביב",
    });

    await addSchedule({
      name: "תפילת מנחה",
      prayer: Prayer.Mincha,
      time: "13:25:00",
      minyan,
    });

    const nextSchedule = await getNextMinyanSchedule(
      minyan.id,
      new Date("2026-04-05T09:00:00+03:00")
    );

    expect(nextSchedule).toEqual(
      expect.objectContaining({
        schedule: expect.objectContaining({
          name: "תפילת מנחה",
          prayer: Prayer.Mincha,
        }),
      })
    );
    expect(nextSchedule?.calculatedTime.toFormat("yyyy-MM-dd HH:mm")).toBe(
      "2026-04-05 13:25"
    );
  });

  it("returns tomorrow's schedule when today's time already passed", async () => {
    const minyan = await saveMinyan({
      name: "בית הכנסת הגדול",
      city: "ירושלים",
    });

    await addSchedule({
      name: "תפילת שחרית",
      prayer: Prayer.Shacharit,
      time: "08:30:00",
      minyan,
    });

    const nextSchedule = await getNextMinyanSchedule(
      minyan.id,
      new Date("2026-04-05T23:30:00+03:00")
    );

    expect(nextSchedule?.schedule.name).toBe("תפילת שחרית");
    expect(nextSchedule?.calculatedTime.toFormat("yyyy-MM-dd HH:mm")).toBe(
      "2026-04-06 08:30"
    );
  });

  it("returns a later upcoming schedule when it is beyond tomorrow", async () => {
    const minyan = await saveMinyan({
      name: "פנס",
      city: "בני ברק",
    });

    await addSchedule({
      name: "תפילת ערבית",
      prayer: Prayer.Arvit,
      time: "20:10:00",
      weekDays: [WeekDay.Wednesday],
      minyan,
    });

    const nextSchedule = await getNextMinyanSchedule(
      minyan.id,
      new Date("2026-05-10T09:00:00+03:00")
    );

    expect(nextSchedule?.schedule.name).toBe("תפילת ערבית");
    expect(nextSchedule?.calculatedTime.toFormat("yyyy-MM-dd HH:mm")).toBe(
      "2026-05-13 20:10"
    );
  });

  it("returns the no-future message when no upcoming schedule exists", async () => {
    const minyan = await saveMinyan({
      name: "שטיבל",
      city: "מודיעין עילית",
    });

    const nextSchedule = await getNextMinyanSchedule(
      minyan.id,
      new Date("2026-04-05T09:00:00+03:00")
    );

    expect(nextSchedule).toBeUndefined();
  });
});
