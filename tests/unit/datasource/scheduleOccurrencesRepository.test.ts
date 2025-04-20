import { ScheduleOccurrence } from "../../../src/datasource/entities/ScheduleOccurrence";
import { getRepo } from "../../../src/datasource/scheduleOccurrencesRepository";

describe("scheduleOccurrencesRepository", () => {
  beforeEach(async () => {});

  afterEach(async () => {
    const occRepo = await getRepo();
    await occRepo.clear();
  });

  it("should add an occurrence schedule, and verify it was saved", async () => {
    const repo = await getRepo();
    const occurrence = new ScheduleOccurrence();
    occurrence.datetime = new Date(2025, 3, 20, 10, 0, 0);
    occurrence.scheduleId = "123456789";
    occurrence.approved = 12;
    occurrence.rejected = 3;
    occurrence.snoozed = 5;
    const savedOccurrence = await repo.save(occurrence);

    const foundOccurrence = await repo.findOne({
      where: { id: savedOccurrence.id },
    });
    console.log("foundOccurrence", foundOccurrence);
    console.log("occurrence", occurrence);

    expect(foundOccurrence!).toEqual(occurrence);
  });
});
