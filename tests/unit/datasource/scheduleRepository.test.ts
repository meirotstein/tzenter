import { Prayer } from "../../../src/datasource/entities/Schedule";
import { saveMinyan } from "../../../src/datasource/minyansRepository";
import {
  addSchedule,
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
});
