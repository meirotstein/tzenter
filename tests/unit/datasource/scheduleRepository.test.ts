import { Prayer, WeekDay } from "../../../src/datasource/entities/Schedule";
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

  it("should save and retrieve a schedule with startAt field", async () => {
    const minyan = { id: 1, name: "Main Hall", city: "Bruchin" };
    const savedMinyan = await saveMinyan(minyan);

    const startDate = new Date("2024-01-01T00:00:00Z");
    const schedule = {
      name: "Morning Prayer with Start Date",
      prayer: Prayer.Shacharit,
      time: "08:00:00",
      minyan: savedMinyan,
      startAt: startDate,
    };

    const savedSchedule = await addSchedule(schedule);
    const fetchedSchedule = await getScheduleById(savedSchedule.id);

    expect(fetchedSchedule).toBeDefined();
    expect(fetchedSchedule?.startAt).toBeDefined();
    expect(fetchedSchedule?.startAt).toEqual("2024-01-01");
  });

  it("should save and retrieve a schedule with endAt field", async () => {
    const minyan = { id: 1, name: "Main Hall", city: "Bruchin" };
    const savedMinyan = await saveMinyan(minyan);

    const endDate = new Date("2024-12-31T23:59:59Z");
    const schedule = {
      name: "Evening Prayer with End Date",
      prayer: Prayer.Arvit,
      time: "19:00:00",
      minyan: savedMinyan,
      endAt: endDate,
    };

    const savedSchedule = await addSchedule(schedule);
    const fetchedSchedule = await getScheduleById(savedSchedule.id);

    expect(fetchedSchedule).toBeDefined();
    expect(fetchedSchedule?.endAt).toBeDefined();
    expect(fetchedSchedule?.endAt).toEqual("2025-01-01");
  });

  it("should save and retrieve a schedule with weekDays field", async () => {
    const minyan = { id: 1, name: "Main Hall", city: "Bruchin" };
    const savedMinyan = await saveMinyan(minyan);

    const weekDays = [WeekDay.Monday, WeekDay.Wednesday, WeekDay.Friday];
    const schedule = {
      name: "Weekday Prayer",
      prayer: Prayer.Mincha,
      time: "13:00:00",
      minyan: savedMinyan,
      weekDays: weekDays,
    };

    const savedSchedule = await addSchedule(schedule);
    const fetchedSchedule = await getScheduleById(savedSchedule.id);

    expect(fetchedSchedule).toBeDefined();
    expect(fetchedSchedule?.weekDays).toBeDefined();
    expect(fetchedSchedule?.weekDays).toEqual(["2", "4", "6"]); // simple-array serializes as strings
    expect(fetchedSchedule?.weekDays).toHaveLength(3);
  });

  it("should save and retrieve a schedule with all new fields", async () => {
    const minyan = { id: 1, name: "Main Hall", city: "Bruchin" };
    const savedMinyan = await saveMinyan(minyan);

    const startDate = new Date("2024-01-01T00:00:00Z");
    const endDate = new Date("2024-12-31T23:59:59Z");
    const weekDays = [WeekDay.Sunday, WeekDay.Tuesday, WeekDay.Thursday, WeekDay.Saturday];
    
    const schedule = {
      name: "Complete Schedule",
      prayer: Prayer.Shacharit,
      time: "08:00:00",
      minyan: savedMinyan,
      startAt: startDate,
      endAt: endDate,
      weekDays: weekDays,
    };

    const savedSchedule = await addSchedule(schedule);
    const fetchedSchedule = await getScheduleById(savedSchedule.id);

    expect(fetchedSchedule).toBeDefined();
    expect(fetchedSchedule?.startAt).toEqual("2024-01-01");
    expect(fetchedSchedule?.endAt).toEqual("2025-01-01");
    expect(fetchedSchedule?.weekDays).toEqual(["1", "3", "5", "7"]); // simple-array serializes as strings
    expect(fetchedSchedule?.weekDays).toHaveLength(4);
  });

  it("should handle null values for new optional fields", async () => {
    const minyan = { id: 1, name: "Main Hall", city: "Bruchin" };
    const savedMinyan = await saveMinyan(minyan);

    const schedule = {
      name: "Schedule with Null Fields",
      prayer: Prayer.Arvit,
      time: "19:00:00",
      minyan: savedMinyan,
      startAt: undefined,
      endAt: undefined,
      weekDays: undefined,
    };

    const savedSchedule = await addSchedule(schedule);
    const fetchedSchedule = await getScheduleById(savedSchedule.id);

    expect(fetchedSchedule).toBeDefined();
    expect(fetchedSchedule?.startAt).toBeNull();
    expect(fetchedSchedule?.endAt).toBeNull();
    expect(fetchedSchedule?.weekDays).toBeNull();
  });

  it("should update existing schedule with new fields", async () => {
    const minyan = { id: 1, name: "Main Hall", city: "Bruchin" };
    const savedMinyan = await saveMinyan(minyan);

    const schedule = {
      name: "Original Schedule",
      prayer: Prayer.Shacharit,
      time: "08:00:00",
      minyan: savedMinyan,
    };

    const savedSchedule = await addSchedule(schedule);

    const startDate = new Date("2024-06-01T00:00:00Z");
    const endDate = new Date("2024-08-31T23:59:59Z");
    const weekDays = [WeekDay.Monday, WeekDay.Friday];

    const updatedData = {
      startAt: startDate,
      endAt: endDate,
      weekDays: weekDays,
    };

    const updatedSchedule = await updateSchedule(savedSchedule.id, updatedData);
    const fetchedSchedule = await getScheduleById(savedSchedule.id);

    expect(fetchedSchedule).toBeDefined();
    expect(fetchedSchedule?.startAt).toEqual("2024-06-01");
    expect(fetchedSchedule?.endAt).toEqual("2024-09-01");
    expect(fetchedSchedule?.weekDays).toEqual(["2", "6"]); // simple-array serializes as strings
  });

  it("should update individual new fields independently", async () => {
    const minyan = { id: 1, name: "Main Hall", city: "Bruchin" };
    const savedMinyan = await saveMinyan(minyan);

    const schedule = {
      name: "Test Schedule",
      prayer: Prayer.Mincha,
      time: "13:00:00",
      minyan: savedMinyan,
    };

    const savedSchedule = await addSchedule(schedule);

    // Update only startAt
    await updateSchedule(savedSchedule.id, { startAt: new Date("2024-01-01T00:00:00Z") });
    let fetchedSchedule = await getScheduleById(savedSchedule.id);
    expect(fetchedSchedule?.startAt).toEqual("2024-01-01");
    expect(fetchedSchedule?.endAt).toBeNull();
    expect(fetchedSchedule?.weekDays).toBeNull();

    // Update only endAt
    await updateSchedule(savedSchedule.id, { endAt: new Date("2024-12-31T23:59:59Z") });
    fetchedSchedule = await getScheduleById(savedSchedule.id);
    expect(fetchedSchedule?.startAt).toEqual("2024-01-01");
    expect(fetchedSchedule?.endAt).toEqual("2025-01-01");
    expect(fetchedSchedule?.weekDays).toBeNull();

    // Update only weekDays
    await updateSchedule(savedSchedule.id, { weekDays: [WeekDay.Tuesday, WeekDay.Thursday] });
    fetchedSchedule = await getScheduleById(savedSchedule.id);
    expect(fetchedSchedule?.startAt).toEqual("2024-01-01");
    expect(fetchedSchedule?.endAt).toEqual("2025-01-01");
    expect(fetchedSchedule?.weekDays).toEqual(["3", "5"]); // simple-array serializes as strings
  });

  it("should handle empty weekDays array", async () => {
    const minyan = { id: 1, name: "Main Hall", city: "Bruchin" };
    const savedMinyan = await saveMinyan(minyan);

    const schedule = {
      name: "Schedule with Empty WeekDays",
      prayer: Prayer.Arvit,
      time: "19:00:00",
      minyan: savedMinyan,
      weekDays: [],
    };

    const savedSchedule = await addSchedule(schedule);
    const fetchedSchedule = await getScheduleById(savedSchedule.id);

    expect(fetchedSchedule).toBeDefined();
    expect(fetchedSchedule?.weekDays).toEqual([]);
    expect(fetchedSchedule?.weekDays).toHaveLength(0);
  });

  it("should handle all weekdays in weekDays array", async () => {
    const minyan = { id: 1, name: "Main Hall", city: "Bruchin" };
    const savedMinyan = await saveMinyan(minyan);

    const allWeekDays = [
      WeekDay.Sunday,
      WeekDay.Monday,
      WeekDay.Tuesday,
      WeekDay.Wednesday,
      WeekDay.Thursday,
      WeekDay.Friday,
      WeekDay.Saturday,
    ];

    const schedule = {
      name: "Daily Schedule",
      prayer: Prayer.Shacharit,
      time: "08:00:00",
      minyan: savedMinyan,
      weekDays: allWeekDays,
    };

    const savedSchedule = await addSchedule(schedule);
    const fetchedSchedule = await getScheduleById(savedSchedule.id);

    expect(fetchedSchedule).toBeDefined();
    expect(fetchedSchedule?.weekDays).toEqual(["1", "2", "3", "4", "5", "6", "7"]); // simple-array serializes as strings
    expect(fetchedSchedule?.weekDays).toHaveLength(7);
  });
});
