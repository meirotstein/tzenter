import { WhatsappClient } from "../../../src/clients/WhatsappClient";
import { Context } from "../../../src/conversation/context";
import { getScheduleById } from "../../../src/datasource/scheduleRepository";
import { ScheduleHandler } from "../../../src/handlers/ScheduleHandler";
import { getUpcomingSchedules } from "../../../src/schedule/getUpcomingSchedule";
import { invokeSchedule } from "../../../src/schedule/invokeSchedule";

jest.mock("../../../src/clients/WhatsappClient");
jest.mock("../../../src/datasource/scheduleRepository");
jest.mock("../../../src/schedule/invokeSchedule");
jest.mock("../../../src/utils");
jest.mock("../../../src/schedule/getUpcomingSchedule");
jest.mock("../../../src/clients/KVClient");

describe("ScheduleHandler", () => {
  let scheduleHandler: ScheduleHandler;

  beforeEach(() => {
    process.env.WA_PHONE_NUMBER_ID = "12345";
    scheduleHandler = new ScheduleHandler();
    jest.clearAllMocks();
  });

  it("should return status 'done' when no schedules are found", async () => {
    (getUpcomingSchedules as jest.Mock).mockResolvedValue([]);

    const response = await scheduleHandler.handle({});

    expect(getUpcomingSchedules).toHaveBeenCalledWith(46);
    expect(response).toEqual({ status: "done", schedules: 0 });
  });

  it("should handle schedules and return statuses", async () => {
    const mockSchedules = [
      { id: 101, message: "Updated message 1" },
      { id: 102, message: "Updated message 2" },
    ];
    const mockScheduleByIdResult = { id: 101, message: "Updated message 1" };
    (getUpcomingSchedules as jest.Mock).mockResolvedValue(mockSchedules);
    (getScheduleById as jest.Mock).mockResolvedValueOnce(
      mockScheduleByIdResult
    );
    (invokeSchedule as jest.Mock)
      .mockResolvedValueOnce("success-101")
      .mockResolvedValueOnce("success-102");

    const response = await scheduleHandler.handle({});

    expect(getUpcomingSchedules).toHaveBeenCalledWith(46);
    expect(invokeSchedule).toHaveBeenCalledTimes(2);
    expect(invokeSchedule).toHaveBeenCalledWith(
      expect.any(WhatsappClient),
      mockScheduleByIdResult,
      expect.any(Context)
    );
    expect(invokeSchedule).toHaveBeenCalledWith(
      expect.any(WhatsappClient),
      mockScheduleByIdResult,
      expect.any(Context)
    );
    expect(response).toEqual({ status: "done", schedules: 2 });
  });

  it("should search for schedules and return empty result when no schedules are found", async () => {
    (getUpcomingSchedules as jest.Mock).mockResolvedValue([]);

    const response = await scheduleHandler.handle({});

    expect(getUpcomingSchedules).toHaveBeenCalledWith(46);
    expect(response).toEqual({ status: "done", schedules: 0 });
  });
});
