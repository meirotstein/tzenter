import { Prayer } from "../../../src/datasource/entities/Schedule";
import { saveMinyan } from "../../../src/datasource/minyansRepository";
import {
  addSchedule,
  getRepo as getScheduleRepo,
} from "../../../src/datasource/scheduleRepository";
import { getUpcomingSchedules } from "../../../src/schedule/getUpcomingSchedule";

describe("getUpcomingSchedules", () => {
  
  afterEach(async () => {
    const scheduleRepo = await getScheduleRepo();
    await scheduleRepo.clear();
  });

  it("should fetch upcoming schedules within the specified time range", async () => {
    const minyan = { id: 1, name: "Main Hall", city: "Bruchin" };

    const savedMinyan = await saveMinyan(minyan);

    const schedules = [
      {
        name: "Morning Prayer",
        prayer: Prayer.Shacharit,
        time: "08:00:00",
        minyan: savedMinyan,
      },
      {
        name: "Afternoon Prayer",
        prayer: Prayer.Mincha,
        time: "13:00:00",
        minyan: savedMinyan,
      },
      {
        name: "Evening Prayer",
        prayer: Prayer.Arvit,
        time: "19:00:00",
        minyan: savedMinyan,
      },
    ];

    for (const schedule of schedules) {
      await addSchedule(schedule);
    }

    const fromDate = new Date("2023-01-01T07:00:00");
    const upcomingSchedules = await getUpcomingSchedules(360, fromDate); // 360 minutes = 6 hours

    expect(upcomingSchedules).toHaveLength(2);
    expect(upcomingSchedules[0].name).toBe("Morning Prayer");
    expect(upcomingSchedules[1].name).toBe("Afternoon Prayer");
  });

  it("should fetch upcoming schedules within the specified time range considering a different timezone", async () => {
    const minyan = { id: 1, name: "Main Hall", city: "Bruchin" };

    const savedMinyan = await saveMinyan(minyan);

    const schedules = [
      {
        name: "Morning Prayer",
        prayer: Prayer.Shacharit,
        time: "08:00:00",
        minyan: savedMinyan,
      },
      {
        name: "Afternoon Prayer",
        prayer: Prayer.Mincha,
        time: "13:00:00",
        minyan: savedMinyan,
      },
      {
        name: "Evening Prayer",
        prayer: Prayer.Arvit,
        time: "19:00:00",
        minyan: savedMinyan,
      },
    ];

    for (const schedule of schedules) {
      await addSchedule(schedule);
    }

    const fromDate = new Date("2023-01-01T07:00:00Z"); // UTC time
    const timezone = "America/New_York"; // Different timezone to consider
    const upcomingSchedules = await getUpcomingSchedules(
      360,
      fromDate,
      timezone
    ); // 360 minutes = 6 hours

    expect(upcomingSchedules).toHaveLength(1);
    expect(upcomingSchedules[0].name).toBe("Morning Prayer");
  });

  it("should fetch upcoming schedules that wrap around midnight", async () => {
    const minyan = { id: 1, name: "Main Hall", city: "Bruchin" };

    const savedMinyan = await saveMinyan(minyan);

    const schedules = [
      {
        name: "Late Night Prayer",
        prayer: Prayer.Arvit,
        time: "23:30:00",
        minyan: savedMinyan,
      },
      {
        name: "Early Morning Prayer",
        prayer: Prayer.Shacharit,
        time: "00:30:00",
        minyan: savedMinyan,
      },
      {
        name: "Morning Prayer",
        prayer: Prayer.Shacharit,
        time: "08:00:00",
        minyan: savedMinyan,
      },
    ];

    for (const schedule of schedules) {
      await addSchedule(schedule);
    }

    const fromDate = new Date("2023-01-01T23:00:00");
    const upcomingSchedules = await getUpcomingSchedules(120, fromDate); // 120 minutes = 2 hours

    expect(upcomingSchedules).toHaveLength(2);
    expect(upcomingSchedules[0].name).toBe("Late Night Prayer");
    expect(upcomingSchedules[1].name).toBe("Early Morning Prayer");
  });

  it("should return an empty array if no schedules are found in the specified time range", async () => {
    const minyan = { id: 1, name: "Main Hall", city: "Bruchin" };

    const savedMinyan = await saveMinyan(minyan);

    const schedules = [
      {
        name: "Morning Prayer",
        prayer: Prayer.Shacharit,
        time: "08:00:00",
        minyan: savedMinyan,
      },
      {
        name: "Afternoon Prayer",
        prayer: Prayer.Mincha,
        time: "13:00:00",
        minyan: savedMinyan,
      },
    ];

    for (const schedule of schedules) {
      await addSchedule(schedule);
    }

    const fromDate = new Date("2023-01-01T20:00:00");
    const upcomingSchedules = await getUpcomingSchedules(60, fromDate); // 60 minutes = 1 hour

    expect(upcomingSchedules).toHaveLength(0);
  });

  it("should handle schedules with overlapping times correctly", async () => {
    const minyan = { id: 1, name: "Main Hall", city: "Bruchin" };

    const savedMinyan = await saveMinyan(minyan);

    const schedules = [
      {
        name: "Overlap Prayer 1",
        prayer: Prayer.Shacharit,
        time: "08:00:00",
        minyan: savedMinyan,
      },
      {
        name: "Overlap Prayer 2",
        prayer: Prayer.Mincha,
        time: "08:00:00",
        minyan: savedMinyan,
      },
    ];

    for (const schedule of schedules) {
      await addSchedule(schedule);
    }

    const fromDate = new Date("2023-01-01T07:00:00");
    const upcomingSchedules = await getUpcomingSchedules(120, fromDate); // 120 minutes = 2 hours

    expect(upcomingSchedules).toHaveLength(2);
    expect(upcomingSchedules[0].name).toBe("Overlap Prayer 1");
    expect(upcomingSchedules[1].name).toBe("Overlap Prayer 2");
  });

  it("should only fetch schedules that are enabled", async () => {
    const minyan = { id: 1, name: "Main Hall", city: "Bruchin" };

    const savedMinyan = await saveMinyan(minyan);

    const schedules = [
      {
        name: "Enabled Prayer",
        prayer: Prayer.Shacharit,
        time: "08:00:00",
        minyan: savedMinyan,
        enabled: true,
      },
      {
        name: "Disabled Prayer",
        prayer: Prayer.Mincha,
        time: "13:00:00",
        minyan: savedMinyan,
        enabled: false,
      },
    ];

    for (const schedule of schedules) {
      await addSchedule(schedule);
    }

    const fromDate = new Date("2023-01-01T07:00:00");
    const upcomingSchedules = await getUpcomingSchedules(360, fromDate); // 360 minutes = 6 hours

    expect(upcomingSchedules).toHaveLength(1);
    expect(upcomingSchedules[0].name).toBe("Enabled Prayer");
  });

  it("should return an empty array if all schedules are disabled", async () => {
    const minyan = { id: 1, name: "Main Hall", city: "Bruchin" };

    const savedMinyan = await saveMinyan(minyan);

    const schedules = [
      {
        name: "Disabled Prayer 1",
        prayer: Prayer.Shacharit,
        time: "08:00:00",
        minyan: savedMinyan,
        enabled: false,
      },
      {
        name: "Disabled Prayer 2",
        prayer: Prayer.Mincha,
        time: "13:00:00",
        minyan: savedMinyan,
        enabled: false,
      },
    ];

    for (const schedule of schedules) {
      await addSchedule(schedule);
    }

    const fromDate = new Date("2023-01-01T07:00:00");
    const upcomingSchedules = await getUpcomingSchedules(360, fromDate); // 360 minutes = 6 hours

    expect(upcomingSchedules).toHaveLength(0);
  });
});
