import { Prayer, Schedule } from "../../../src/datasource/entities/Schedule";
import { scheduleAnnouncements } from "../../../src/schedule/scheduleAnnouncements";

describe("scheduleAnnouncements", () => {
  describe("Omer Count Messages", () => {
    it("should return the correct Omer count message for Arvit prayer", async () => {
      const schedule: Schedule = { prayer: Prayer.Arvit } as Schedule;
      const currentDate = new Date(2025, 3, 14); // April 14, 2025
      const result = await scheduleAnnouncements(schedule, currentDate);

      expect(result).toContain("היום נספור 2 ימים לעומר");
    });

    it("should return the correct Omer count message with weeks and days", async () => {
      const schedule: Schedule = { prayer: Prayer.Arvit } as Schedule;
      const currentDate = new Date(2025, 3, 20); // April 20, 2025
      const result = await scheduleAnnouncements(schedule, currentDate);

      expect(result).toContain("היום נספור 8 ימים שהם 1 שבועות ו1 ימים לעומר");
    });

    it("should return an empty array for non-Arvit prayers", async () => {
      const schedule: Schedule = { prayer: Prayer.Shacharit } as Schedule;
      const currentDate = new Date(2025, 3, 14); // April 14, 2025
      const result = await scheduleAnnouncements(schedule, currentDate);

      expect(result).toEqual([]);
    });

    it("should handle dates before the Omer count starts", async () => {
      const schedule: Schedule = { prayer: Prayer.Arvit } as Schedule;
      const currentDate = new Date(2025, 3, 12); // April 12, 2025
      const result = await scheduleAnnouncements(schedule, currentDate);

      expect(result).toEqual([]);
    });
  });
});
