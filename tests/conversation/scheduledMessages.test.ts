import { WhatsappClient } from "../../src/clients/WhatsappClient";
import {
  getInitScheduleStep,
  getProcessScheduleStep,
} from "../../src/conversation";
import { Context, ContextType } from "../../src/conversation/context";
import { handleSchedule } from "../../src/conversation/scheduledMessages";
import { ScheduleStatus } from "../../src/conversation/types";
import { Schedule } from "../../src/datasource/entities/Schedule";
import { getMinyanById } from "../../src/datasource/minyansRepository";

jest.mock("../../src/datasource/minyansRepository");
jest.mock("../../src/conversation/context");
jest.mock("../../src/conversation", () => ({
  getInitScheduleStep: jest.fn(),
  getProcessScheduleStep: jest.fn(),
}));

describe("handleSchedule", () => {
  let waClient: WhatsappClient;
  let schedule: Schedule;
  let userContext: Context<any>;
  let scheduleContext: Context<any>;

  beforeEach(() => {
    waClient = {} as WhatsappClient;
    schedule = {
      minyan: {
        id: 1,
        users: [{ id: 1, phone: "1234567890" }],
      },
    } as Schedule;

    userContext = new Context("1", ContextType.Schedule);
    scheduleContext = new Context("1", ContextType.User);
    jest.spyOn(userContext, "get").mockResolvedValue(null);
    jest.spyOn(userContext, "set").mockResolvedValue();
    jest.spyOn(scheduleContext, "get").mockResolvedValue(null);
    jest.spyOn(scheduleContext, "set").mockResolvedValue();

    (getMinyanById as jest.Mock).mockResolvedValue({
      id: 1,
      users: [{ id: 1, phone: "1234567890" }],
    });

    (getInitScheduleStep as jest.Mock).mockReturnValue({
      id: "initStep",
      action: jest.fn().mockResolvedValue(void 0),
    });

    (getProcessScheduleStep as jest.Mock).mockReturnValue({
      id: "processingStep",
      action: jest.fn().mockResolvedValue(void 0),
    });

    Context.getContext = jest.fn().mockReturnValue(scheduleContext);
  });

  it("should initiate the schedule if no context exists", async () => {
    const result = await handleSchedule(waClient, schedule, userContext);

    expect(getMinyanById).toHaveBeenCalledWith(1);
    expect(userContext.set).toHaveBeenCalledWith({
      status: ScheduleStatus.initiated,
    });
    expect(result).toBe(ScheduleStatus.initiated);
  });

  it("should process the schedule if context status is initiated", async () => {
    jest
      .spyOn(userContext, "get")
      .mockResolvedValue({ status: ScheduleStatus.initiated });

    const result = await handleSchedule(waClient, schedule, userContext);

    expect(getMinyanById).toHaveBeenCalledWith(1);
    expect(userContext.set).toHaveBeenCalledWith({
      status: ScheduleStatus.processing,
    });
    expect(result).toBe(ScheduleStatus.processing);
  });

  it("should throw an error if minyan is not found", async () => {
    (getMinyanById as jest.Mock).mockResolvedValue(null);

    await expect(
      handleSchedule(waClient, schedule, userContext)
    ).rejects.toThrow("Minyan with id 1 not found");
  });

  it("should call the schedule step action for each user", async () => {
    const mockAction = jest.fn().mockResolvedValue(void 0);
    (getInitScheduleStep as jest.Mock).mockReturnValue({
      id: "initStep",
      action: mockAction,
    });

    await handleSchedule(waClient, schedule, userContext);

    expect(mockAction).toHaveBeenCalledWith(
      1234567890,
      waClient,
      "",
      expect.any(Context)
    );
  });
});
