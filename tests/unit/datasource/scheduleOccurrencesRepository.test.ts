import { ScheduleOccurrence } from "../../../src/datasource/entities/ScheduleOccurrence";
import {
  getRepo,
  getScheduleInvocationOccurrence,
  getScheduleOccurrenceById,
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

  it("should get the occurrence for a schedule invocation", async () => {
    const occurrence1 = new ScheduleOccurrence();
    occurrence1.datetime = new Date(2025, 3, 20, 10, 0, 0);
    occurrence1.scheduleId = 555555;
    occurrence1.approved = 10;
    occurrence1.rejected = 2;
    occurrence1.snoozed = 1;
    occurrence1.invocationId = "invocation-123";

    const occurrence2 = new ScheduleOccurrence();
    occurrence2.datetime = new Date(2025, 3, 21, 12, 0, 0); // Later datetime
    occurrence2.scheduleId = 555555;
    occurrence2.approved = 15;
    occurrence2.rejected = 1;
    occurrence2.snoozed = 0;
    occurrence2.invocationId = "invocation-456";

    await saveScheduleOccurrence(occurrence1);
    await saveScheduleOccurrence(occurrence2);

    const occurrence2Instance = await getScheduleInvocationOccurrence(
      occurrence2.invocationId
    );

    expect(occurrence2Instance).toEqual(occurrence2);
  });

  it("should return null if no occurrences exist for a schedule invocation", async () => {
    const lastOccurrence = await getScheduleInvocationOccurrence("999999"); // Non-existent scheduleId
    expect(lastOccurrence).toBeNull();
  });
});
