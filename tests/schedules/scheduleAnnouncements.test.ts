import { scheduleAnnouncements } from "../../src/schedule/scheduleAnnouncements";
import { Prayer, Schedule } from "../../src/datasource/entities/Schedule";
import { DateTime } from "luxon";

describe("scheduleAnnouncements", () => {
  describe("Omer Count Messages", () => {
    it("should return the correct Omer count message for Arvit prayer", () => {
      const schedule: Schedule = { prayer: Prayer.Arvit } as Schedule;
      const currentDate = new Date(2025, 3, 14); // April 14, 2025
      const result = scheduleAnnouncements(schedule, currentDate);

      expect(result).toContain("היום נספור 2 ימים לעומר");
    });

    it("should return the correct Omer count message with weeks and days", () => {
      const schedule: Schedule = { prayer: Prayer.Arvit } as Schedule;
      const currentDate = new Date(2025, 3, 20); // April 20, 2025
      const result = scheduleAnnouncements(schedule, currentDate);

      expect(result).toContain("היום נספור 8 ימים שהם 1 שבועות ו1 ימים לעומר");
    });

    it("should return an empty array for non-Arvit prayers", () => {
      const schedule: Schedule = { prayer: Prayer.Shacharit } as Schedule;
      const currentDate = new Date(2025, 3, 14); // April 14, 2025
      const result = scheduleAnnouncements(schedule, currentDate);

      expect(result).toEqual([]);
    });

    it("should handle the first day of Omer correctly", () => {
      const schedule: Schedule = { prayer: Prayer.Arvit } as Schedule;
      const currentDate = new Date(2025, 3, 13); // April 13, 2025
      const result = scheduleAnnouncements(schedule, currentDate);

      expect(result).toContain("היום נספור 1 ימים לעומר");
    });

    it("should handle dates before the Omer count starts", () => {
      const schedule: Schedule = { prayer: Prayer.Arvit } as Schedule;
      const currentDate = new Date(2025, 3, 12); // April 12, 2025
      const result = scheduleAnnouncements(schedule, currentDate);

      expect(result).toEqual([]);
    });
  });
});
