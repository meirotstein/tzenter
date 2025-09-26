import { ScheduleConfig, ScheduleConfigFlag } from "../../../src/datasource/entities/ScheduleConfig";

describe("ScheduleConfig", () => {
  describe("hasFlag", () => {
    it("should return false for undefined config", () => {
      expect(ScheduleConfig.hasFlag(undefined, ScheduleConfigFlag.RUN_ON_HOLIDAY)).toBe(false);
      expect(ScheduleConfig.hasFlag(undefined, ScheduleConfigFlag.RUN_ON_HOLIDAY_EVE)).toBe(false);
    });

    it("should return false for null config", () => {
      expect(ScheduleConfig.hasFlag(null as any, ScheduleConfigFlag.RUN_ON_HOLIDAY)).toBe(false);
      expect(ScheduleConfig.hasFlag(null as any, ScheduleConfigFlag.RUN_ON_HOLIDAY_EVE)).toBe(false);
    });

    it("should return false for config 0", () => {
      expect(ScheduleConfig.hasFlag(0, ScheduleConfigFlag.RUN_ON_HOLIDAY)).toBe(false);
      expect(ScheduleConfig.hasFlag(0, ScheduleConfigFlag.RUN_ON_HOLIDAY_EVE)).toBe(false);
    });

    it("should return true when flag is set", () => {
      expect(ScheduleConfig.hasFlag(1, ScheduleConfigFlag.RUN_ON_HOLIDAY)).toBe(true);
      expect(ScheduleConfig.hasFlag(2, ScheduleConfigFlag.RUN_ON_HOLIDAY_EVE)).toBe(true);
    });

    it("should return false when flag is not set", () => {
      expect(ScheduleConfig.hasFlag(2, ScheduleConfigFlag.RUN_ON_HOLIDAY)).toBe(false);
      expect(ScheduleConfig.hasFlag(1, ScheduleConfigFlag.RUN_ON_HOLIDAY_EVE)).toBe(false);
    });

    it("should work with multiple flags set", () => {
      const config = 3; // Both flags set (1 + 2)
      expect(ScheduleConfig.hasFlag(config, ScheduleConfigFlag.RUN_ON_HOLIDAY)).toBe(true);
      expect(ScheduleConfig.hasFlag(config, ScheduleConfigFlag.RUN_ON_HOLIDAY_EVE)).toBe(true);
    });
  });

  describe("setFlag", () => {
    it("should set flag on undefined config", () => {
      const result = ScheduleConfig.setFlag(undefined, ScheduleConfigFlag.RUN_ON_HOLIDAY);
      expect(result).toBe(1);
    });

    it("should set flag on null config", () => {
      const result = ScheduleConfig.setFlag(null as any, ScheduleConfigFlag.RUN_ON_HOLIDAY);
      expect(result).toBe(1);
    });

    it("should set flag on existing config", () => {
      const result = ScheduleConfig.setFlag(2, ScheduleConfigFlag.RUN_ON_HOLIDAY);
      expect(result).toBe(3); // 2 + 1 = 3
    });

    it("should not duplicate flag if already set", () => {
      const result = ScheduleConfig.setFlag(1, ScheduleConfigFlag.RUN_ON_HOLIDAY);
      expect(result).toBe(1);
    });

    it("should set multiple flags", () => {
      let config = ScheduleConfig.setFlag(undefined, ScheduleConfigFlag.RUN_ON_HOLIDAY);
      config = ScheduleConfig.setFlag(config, ScheduleConfigFlag.RUN_ON_HOLIDAY_EVE);
      expect(config).toBe(3);
    });
  });

  describe("unsetFlag", () => {
    it("should return 0 for undefined config", () => {
      const result = ScheduleConfig.unsetFlag(undefined, ScheduleConfigFlag.RUN_ON_HOLIDAY);
      expect(result).toBe(0);
    });

    it("should return 0 for null config", () => {
      const result = ScheduleConfig.unsetFlag(null as any, ScheduleConfigFlag.RUN_ON_HOLIDAY);
      expect(result).toBe(0);
    });

    it("should unset flag from existing config", () => {
      const result = ScheduleConfig.unsetFlag(3, ScheduleConfigFlag.RUN_ON_HOLIDAY);
      expect(result).toBe(2); // 3 - 1 = 2
    });

    it("should not change config if flag not set", () => {
      const result = ScheduleConfig.unsetFlag(2, ScheduleConfigFlag.RUN_ON_HOLIDAY);
      expect(result).toBe(2);
    });

    it("should unset multiple flags", () => {
      let config = 3; // Both flags set
      config = ScheduleConfig.unsetFlag(config, ScheduleConfigFlag.RUN_ON_HOLIDAY);
      expect(config).toBe(2);
      config = ScheduleConfig.unsetFlag(config, ScheduleConfigFlag.RUN_ON_HOLIDAY_EVE);
      expect(config).toBe(0);
    });
  });

  describe("toggleFlag", () => {
    it("should set flag on undefined config", () => {
      const result = ScheduleConfig.toggleFlag(undefined, ScheduleConfigFlag.RUN_ON_HOLIDAY);
      expect(result).toBe(1);
    });

    it("should set flag on null config", () => {
      const result = ScheduleConfig.toggleFlag(null as any, ScheduleConfigFlag.RUN_ON_HOLIDAY);
      expect(result).toBe(1);
    });

    it("should toggle flag from unset to set", () => {
      const result = ScheduleConfig.toggleFlag(0, ScheduleConfigFlag.RUN_ON_HOLIDAY);
      expect(result).toBe(1);
    });

    it("should toggle flag from set to unset", () => {
      const result = ScheduleConfig.toggleFlag(1, ScheduleConfigFlag.RUN_ON_HOLIDAY);
      expect(result).toBe(0);
    });

    it("should toggle individual flags independently", () => {
      let config = 1; // Only RUN_ON_HOLIDAY set
      config = ScheduleConfig.toggleFlag(config, ScheduleConfigFlag.RUN_ON_HOLIDAY_EVE);
      expect(config).toBe(3); // Both flags now set
      config = ScheduleConfig.toggleFlag(config, ScheduleConfigFlag.RUN_ON_HOLIDAY);
      expect(config).toBe(2); // Only RUN_ON_HOLIDAY_EVE set
    });
  });

  describe("shouldRunOnHoliday", () => {
    it("should return false for undefined config", () => {
      expect(ScheduleConfig.shouldRunOnHoliday(undefined)).toBe(false);
    });

    it("should return false for null config", () => {
      expect(ScheduleConfig.shouldRunOnHoliday(null as any)).toBe(false);
    });

    it("should return false when flag not set", () => {
      expect(ScheduleConfig.shouldRunOnHoliday(0)).toBe(false);
      expect(ScheduleConfig.shouldRunOnHoliday(2)).toBe(false);
    });

    it("should return true when flag is set", () => {
      expect(ScheduleConfig.shouldRunOnHoliday(1)).toBe(true);
      expect(ScheduleConfig.shouldRunOnHoliday(3)).toBe(true);
    });
  });

  describe("shouldRunOnHolidayEve", () => {
    it("should return false for undefined config", () => {
      expect(ScheduleConfig.shouldRunOnHolidayEve(undefined)).toBe(false);
    });

    it("should return false for null config", () => {
      expect(ScheduleConfig.shouldRunOnHolidayEve(null as any)).toBe(false);
    });

    it("should return false when flag not set", () => {
      expect(ScheduleConfig.shouldRunOnHolidayEve(0)).toBe(false);
      expect(ScheduleConfig.shouldRunOnHolidayEve(1)).toBe(false);
    });

    it("should return true when flag is set", () => {
      expect(ScheduleConfig.shouldRunOnHolidayEve(2)).toBe(true);
      expect(ScheduleConfig.shouldRunOnHolidayEve(3)).toBe(true);
    });
  });

  describe("setRunOnHoliday", () => {
    it("should set flag to true on undefined config", () => {
      const result = ScheduleConfig.setRunOnHoliday(undefined, true);
      expect(result).toBe(1);
    });

    it("should set flag to false on undefined config", () => {
      const result = ScheduleConfig.setRunOnHoliday(undefined, false);
      expect(result).toBe(0);
    });

    it("should set flag to true on existing config", () => {
      const result = ScheduleConfig.setRunOnHoliday(2, true);
      expect(result).toBe(3);
    });

    it("should set flag to false on existing config", () => {
      const result = ScheduleConfig.setRunOnHoliday(3, false);
      expect(result).toBe(2);
    });

    it("should not change config when setting to current value", () => {
      const result1 = ScheduleConfig.setRunOnHoliday(1, true);
      expect(result1).toBe(1);
      const result2 = ScheduleConfig.setRunOnHoliday(2, false);
      expect(result2).toBe(2);
    });
  });

  describe("setRunOnHolidayEve", () => {
    it("should set flag to true on undefined config", () => {
      const result = ScheduleConfig.setRunOnHolidayEve(undefined, true);
      expect(result).toBe(2);
    });

    it("should set flag to false on undefined config", () => {
      const result = ScheduleConfig.setRunOnHolidayEve(undefined, false);
      expect(result).toBe(0);
    });

    it("should set flag to true on existing config", () => {
      const result = ScheduleConfig.setRunOnHolidayEve(1, true);
      expect(result).toBe(3);
    });

    it("should set flag to false on existing config", () => {
      const result = ScheduleConfig.setRunOnHolidayEve(3, false);
      expect(result).toBe(1);
    });

    it("should not change config when setting to current value", () => {
      const result1 = ScheduleConfig.setRunOnHolidayEve(2, true);
      expect(result1).toBe(2);
      const result2 = ScheduleConfig.setRunOnHolidayEve(1, false);
      expect(result2).toBe(1);
    });
  });

  describe("Integration tests", () => {
    it("should handle complex flag operations", () => {
      // Start with no flags
      let config: number | undefined = undefined;
      
      // Set both flags
      config = ScheduleConfig.setRunOnHoliday(config, true);
      config = ScheduleConfig.setRunOnHolidayEve(config, true);
      expect(config).toBe(3);
      expect(ScheduleConfig.shouldRunOnHoliday(config)).toBe(true);
      expect(ScheduleConfig.shouldRunOnHolidayEve(config)).toBe(true);

      // Toggle one flag
      config = ScheduleConfig.toggleFlag(config, ScheduleConfigFlag.RUN_ON_HOLIDAY);
      expect(config).toBe(2);
      expect(ScheduleConfig.shouldRunOnHoliday(config)).toBe(false);
      expect(ScheduleConfig.shouldRunOnHolidayEve(config)).toBe(true);

      // Unset remaining flag
      config = ScheduleConfig.unsetFlag(config, ScheduleConfigFlag.RUN_ON_HOLIDAY_EVE);
      expect(config).toBe(0);
      expect(ScheduleConfig.shouldRunOnHoliday(config)).toBe(false);
      expect(ScheduleConfig.shouldRunOnHolidayEve(config)).toBe(false);
    });

    it("should handle edge cases with flag values", () => {
      // Test with maximum possible values
      const maxConfig = 0xFFFFFFFF;
      expect(ScheduleConfig.hasFlag(maxConfig, ScheduleConfigFlag.RUN_ON_HOLIDAY)).toBe(true);
      expect(ScheduleConfig.hasFlag(maxConfig, ScheduleConfigFlag.RUN_ON_HOLIDAY_EVE)).toBe(true);

      // Test with negative values (should still work due to bitwise operations)
      const negativeConfig = -1;
      expect(ScheduleConfig.hasFlag(negativeConfig, ScheduleConfigFlag.RUN_ON_HOLIDAY)).toBe(true);
      expect(ScheduleConfig.hasFlag(negativeConfig, ScheduleConfigFlag.RUN_ON_HOLIDAY_EVE)).toBe(true);
    });
  });
});
