import { WhatsappClient } from "../../src/clients/WhatsappClient";
import { Context } from "../../src/conversation/context";
import { handleSchedule } from "../../src/conversation/scheduledMessages";
import { getUpcomingSchedules } from "../../src/datasource/scheduleRepository";
import { ScheduleHandler } from "../../src/handlers/ScheduleHandler";

jest.mock("../../src/clients/WhatsappClient");
jest.mock("../../src/datasource/scheduleRepository");
jest.mock("../../src/conversation/scheduledMessages");

describe("ScheduleHandler", () => {
  let scheduleHandler: ScheduleHandler;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.WA_PHONE_NUMBER_ID = "12345";
    scheduleHandler = new ScheduleHandler();
  });

  it("should return status 'done' when no schedules are found", async () => {
    (getUpcomingSchedules as jest.Mock).mockResolvedValue([]);

    const response = await scheduleHandler.handle({});

    expect(getUpcomingSchedules).toHaveBeenCalledWith(60);
    expect(response).toEqual({ status: "done" });
  });

  it("should handle schedules and return statuses", async () => {
    const mockSchedules = [
      { id: 1, message: "Test message 1" },
      { id: 2, message: "Test message 2" },
    ];
    (getUpcomingSchedules as jest.Mock).mockResolvedValue(mockSchedules);
    (handleSchedule as jest.Mock)
      .mockResolvedValueOnce("success-1")
      .mockResolvedValueOnce("success-2");

    const response = await scheduleHandler.handle({});

    expect(getUpcomingSchedules).toHaveBeenCalledWith(60);
    expect(handleSchedule).toHaveBeenCalledTimes(2);
    expect(handleSchedule).toHaveBeenCalledWith(
      expect.any(WhatsappClient),
      mockSchedules[0],
      expect.any(Context)
    );
    expect(handleSchedule).toHaveBeenCalledWith(
      expect.any(WhatsappClient),
      mockSchedules[1],
      expect.any(Context)
    );
    expect(response).toEqual({ status: "done" });
  });
});
