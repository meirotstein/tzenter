import { Prayer } from "../../../src/datasource/entities/Schedule";
import { saveMinyan } from "../../../src/datasource/minyansRepository";
import {
  addSchedule,
  getAllSchedules,
  getScheduleById,
  getRepo as getScheduleRepo,
  updateSchedule,
} from "../../../src/datasource/scheduleRepository";

describe("scheduleRepository", () => {
  beforeEach(async () => {});

  afterEach(async () => {
    const scheduleRepo = await getScheduleRepo();
    await scheduleRepo.clear();
  });

  it("should save a schedule and assign it to a minyan entity", async () => {
    const minyan = { id: 1, name: "Main Hall", city: "Bruchin" };

    const savedMinyan = await saveMinyan(minyan);

    const schedule = {
      name: "Morning Prayer",
      prayer: Prayer.Shacharit,
      time: "08:00 AM",
      minyan: savedMinyan,
    };

    let savedSchedule = await addSchedule(schedule);

    const fetchedSchedule = await getScheduleById(savedSchedule.id);

    expect(fetchedSchedule).toBeDefined();
    expect(fetchedSchedule?.name).toBe("Morning Prayer");
    expect(fetchedSchedule?.time).toBe("08:00 AM");
    expect(fetchedSchedule?.minyan).toBeDefined();
    expect(fetchedSchedule?.minyan?.name).toBe("Main Hall");
    expect(fetchedSchedule?.minyan?.city).toBe("Bruchin");
  });

  it("should update an existing schedule with new data", async () => {
    const minyan = { id: 1, name: "Main Hall", city: "Bruchin" };

    const savedMinyan = await saveMinyan(minyan);

    const schedule = {
      name: "Morning Prayer",
      prayer: Prayer.Shacharit,
      time: "08:00 AM",
      minyan: savedMinyan,
    };

    const savedSchedule = await addSchedule(schedule);

    const updatedData = {
      name: "Updated Morning Prayer",
      time: "09:00 AM",
    };

    const updatedSchedule = await updateSchedule(savedSchedule.id, updatedData);

    const fetchedSchedule = await getScheduleById(savedSchedule.id);

    expect(fetchedSchedule).toBeDefined();
    expect(fetchedSchedule?.name).toBe("Updated Morning Prayer");
    expect(fetchedSchedule?.time).toBe("09:00 AM");
    expect(fetchedSchedule?.minyan).toBeDefined();
    expect(fetchedSchedule?.minyan?.name).toBe("Main Hall");
    expect(fetchedSchedule?.minyan?.city).toBe("Bruchin");
  });

  it("should update the enabled status of a schedule", async () => {
    const minyan = { id: 1, name: "Main Hall", city: "Bruchin" };

    const savedMinyan = await saveMinyan(minyan);

    const schedule = {
      name: "Morning Prayer",
      prayer: Prayer.Shacharit,
      time: "08:00:00",
      minyan: savedMinyan,
      enabled: true,
    };

    const savedSchedule = await addSchedule(schedule);

    const updatedData = {
      enabled: false,
    };

    const updatedSchedule = await updateSchedule(savedSchedule.id, updatedData);

    const fetchedSchedule = await getScheduleById(savedSchedule.id);

    expect(fetchedSchedule).toBeDefined();
    expect(fetchedSchedule?.enabled).toBe(false);
  });

  it("should filter schedules by enabled status", async () => {
    const minyan = { id: 1, name: "Main Hall", city: "Bruchin" };
    const savedMinyan = await saveMinyan(minyan);

    const schedules = [
      {
        name: "Enabled Prayer 1",
        prayer: Prayer.Shacharit,
        time: "08:00:00",
        minyan: savedMinyan,
        enabled: true,
      },
      {
        name: "Enabled Prayer 2",
        prayer: Prayer.Mincha,
        time: "13:00:00",
        minyan: savedMinyan,
        enabled: true,
      },
      {
        name: "Disabled Prayer 1",
        prayer: Prayer.Arvit,
        time: "19:00:00",
        minyan: savedMinyan,
        enabled: false,
      },
      {
        name: "Disabled Prayer 2",
        prayer: Prayer.Shacharit,
        time: "06:00:00",
        minyan: savedMinyan,
        enabled: false,
      },
    ];

    for (const schedule of schedules) {
      await addSchedule(schedule);
    }

    // Test default behavior (enabled=true)
    const enabledSchedules = await getAllSchedules();
    expect(enabledSchedules).toHaveLength(2);
    expect(enabledSchedules.map((s) => s.name)).toEqual([
      "Enabled Prayer 1",
      "Enabled Prayer 2",
    ]);

    // Test explicitly getting disabled schedules
    const disabledSchedules = await getAllSchedules(false);
    expect(disabledSchedules).toHaveLength(2);
    expect(disabledSchedules.map((s) => s.name)).toEqual([
      "Disabled Prayer 1",
      "Disabled Prayer 2",
    ]);
  });
});
