import { ScheduleOccurrence } from "../../../src/datasource/entities/ScheduleOccurrence";
import {
  getRepo,
  getScheduleOccurrenceById,
  getScheduleOccurrencesByScheduleId,
  saveScheduleOccurrence,
} from "../../../src/datasource/scheduleOccurrencesRepository";

describe("scheduleOccurrencesRepository", () => {
  beforeEach(async () => {});

  afterEach(async () => {
    const occRepo = await getRepo();
    await occRepo.clear();
  });

  it("should save and update schedule occurrence", async () => {
    const occurrence = new ScheduleOccurrence();
    occurrence.datetime = new Date(2025, 3, 20, 10, 0, 0);
    occurrence.scheduleId = 987654321;
    occurrence.approved = 12;
    occurrence.rejected = 3;
    occurrence.snoozed = 5;
    await saveScheduleOccurrence(occurrence);
    await saveScheduleOccurrence({ ...occurrence, snoozed: 10 });

    const foundOccurrence = await getScheduleOccurrenceById(occurrence.id);
    expect(foundOccurrence).toEqual({
      ...occurrence,
      snoozed: 10,
    });
  });

  it("should get occurrence by id and scheduleId", async () => {
    const occurrence = new ScheduleOccurrence();
    occurrence.datetime = new Date(2025, 3, 20, 10, 0, 0);
    occurrence.scheduleId = 123456789;
    occurrence.approved = 12;
    occurrence.rejected = 3;
    occurrence.snoozed = 5;
    await saveScheduleOccurrence(occurrence);

    const foundOccurrenceByScheduleId =
      await getScheduleOccurrencesByScheduleId(123456789);
    const foundOccurrenceById = await getScheduleOccurrenceById(
      foundOccurrenceByScheduleId!.id
    );

    expect(foundOccurrenceByScheduleId!).toEqual(foundOccurrenceById);
  });
});
