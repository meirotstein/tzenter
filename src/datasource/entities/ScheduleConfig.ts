// Bitmap flags for Schedule configuration
export enum ScheduleConfigFlag {
  RUN_ON_HOLIDAY = 1 << 0,        // 1
  RUN_ON_HOLIDAY_EVE = 1 << 1,    // 2
}

// Helper functions for working with Schedule configuration bitmap
export class ScheduleConfig {
  /**
   * Check if a specific flag is set in the configuration
   */
  static hasFlag(config: number | undefined, flag: ScheduleConfigFlag): boolean {
    if (config === undefined || config === null) {
      return false;
    }
    return (config & flag) === flag;
  }

  /**
   * Set a specific flag in the configuration
   */
  static setFlag(config: number | undefined, flag: ScheduleConfigFlag): number {
    const currentConfig = config || 0;
    return currentConfig | flag;
  }

  /**
   * Unset a specific flag in the configuration
   */
  static unsetFlag(config: number | undefined, flag: ScheduleConfigFlag): number {
    const currentConfig = config || 0;
    return currentConfig & ~flag;
  }

  /**
   * Toggle a specific flag in the configuration
   */
  static toggleFlag(config: number | undefined, flag: ScheduleConfigFlag): number {
    const currentConfig = config || 0;
    return currentConfig ^ flag;
  }

  /**
   * Check if the schedule should run on holidays
   */
  static shouldRunOnHoliday(config: number | undefined): boolean {
    return this.hasFlag(config, ScheduleConfigFlag.RUN_ON_HOLIDAY);
  }

  /**
   * Check if the schedule should run on holiday eves
   */
  static shouldRunOnHolidayEve(config: number | undefined): boolean {
    return this.hasFlag(config, ScheduleConfigFlag.RUN_ON_HOLIDAY_EVE);
  }

  /**
   * Set the runOnHoliday flag
   */
  static setRunOnHoliday(config: number | undefined, value: boolean): number {
    return value 
      ? this.setFlag(config, ScheduleConfigFlag.RUN_ON_HOLIDAY)
      : this.unsetFlag(config, ScheduleConfigFlag.RUN_ON_HOLIDAY);
  }

  /**
   * Set the runOnHolidayEve flag
   */
  static setRunOnHolidayEve(config: number | undefined, value: boolean): number {
    return value 
      ? this.setFlag(config, ScheduleConfigFlag.RUN_ON_HOLIDAY_EVE)
      : this.unsetFlag(config, ScheduleConfigFlag.RUN_ON_HOLIDAY_EVE);
  }
}
