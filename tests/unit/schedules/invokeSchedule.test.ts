import { WhatsappClient } from "../../../src/clients/WhatsappClient";
import {
  getInitScheduleStep,
  getProcessScheduleStep,
} from "../../../src/conversation";
import { Context, ContextType } from "../../../src/conversation/context";

import { ScheduleStatus } from "../../../src/conversation/types";
import { Schedule } from "../../../src/datasource/entities/Schedule";
import { getMinyanById } from "../../../src/datasource/minyansRepository";
import {
  getScheduleInvocationOccurrence,
  saveScheduleOccurrence,
} from "../../../src/datasource/scheduleOccurrencesRepository";
import { invokeSchedule } from "../../../src/schedule/invokeSchedule";

jest.mock("../../../src/datasource/minyansRepository");
jest.mock("../../../src/datasource/scheduleOccurrencesRepository");
jest.mock("../../../src/conversation/context");
jest.mock("../../../src/conversation", () => ({
  getInitScheduleStep: jest.fn(),
  getProcessScheduleStep: jest.fn(),
}));

describe("invokeSchedule", () => {
  let waClient: WhatsappClient;
  let schedule: Schedule;
  let scheduleContext: Context<any>;
  let userContext: Context<any>;

  beforeEach(() => {
    waClient = {} as WhatsappClient;
    schedule = {
      id: 1,
      minyan: {
        id: 1,
        users: [{ id: 1, phone: "1234567890" }],
      },
    } as Schedule;

    scheduleContext = new Context("1", ContextType.Schedule);
    userContext = new Context("1", ContextType.User);
    jest.spyOn(scheduleContext, "get").mockResolvedValue(null);
    jest.spyOn(scheduleContext, "set").mockResolvedValue();
    jest.spyOn(userContext, "get").mockResolvedValue(null);
    jest.spyOn(userContext, "set").mockResolvedValue();

    (getMinyanById as jest.Mock).mockResolvedValue({
      id: 1,
      users: [{ id: 1, phone: "1234567890" }],
    });

    (getScheduleInvocationOccurrence as jest.Mock).mockResolvedValue(null);
    (saveScheduleOccurrence as jest.Mock).mockResolvedValue({});

    (getInitScheduleStep as jest.Mock).mockReturnValue({
      id: "initStep",
      action: jest.fn().mockResolvedValue(void 0),
    });

    (getProcessScheduleStep as jest.Mock).mockReturnValue({
      id: "processingStep",
      action: jest.fn().mockResolvedValue(void 0),
    });

    Context.getContext = jest.fn().mockReturnValue(userContext);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should initiate the schedule if no context exists", async () => {
    const result = await invokeSchedule(waClient, schedule, scheduleContext);

    expect(getMinyanById).toHaveBeenCalledWith(1);
    expect(scheduleContext.update).toHaveBeenCalledWith({
      invocationId: expect.any(String),
      startedAt: expect.any(Number),
      updatedAt: expect.any(Number),
      status: ScheduleStatus.initiated,
    });
    expect(result).toBe(ScheduleStatus.initiated);
  });

  it("should process the schedule if context status is initiated", async () => {
    jest
      .spyOn(scheduleContext, "get")
      .mockResolvedValue({ status: ScheduleStatus.initiated });

    const result = await invokeSchedule(waClient, schedule, scheduleContext);

    expect(getMinyanById).toHaveBeenCalledWith(1);
    expect(scheduleContext.update).toHaveBeenCalledWith({
      invocationId: expect.any(String),
      startedAt: expect.any(Number),
      updatedAt: expect.any(Number),
      status: ScheduleStatus.processing,
    });
    expect(result).toBe(ScheduleStatus.processing);
  });

  it("should throw an error if minyan is not found", async () => {
    (getMinyanById as jest.Mock).mockResolvedValue(null);

    await expect(
      invokeSchedule(waClient, schedule, scheduleContext)
    ).rejects.toThrow("Minyan with id 1 not found");
  });

  it("should call the schedule step action for each user", async () => {
    const mockAction = jest.fn().mockResolvedValue(void 0);
    (getInitScheduleStep as jest.Mock).mockReturnValue({
      id: "initStep",
      action: mockAction,
    });

    await invokeSchedule(waClient, schedule, scheduleContext);

    expect(mockAction).toHaveBeenCalledWith(
      1234567890,
      waClient,
      {},
      expect.any(Context)
    );
  });

  it("should skip the schedule if the last process interval time has not passed", async () => {
    const mockUpdatedAt = Date.now() - 5 * 60 * 1000; // 5 minutes ago
    jest.spyOn(scheduleContext, "get").mockResolvedValue({
      updatedAt: mockUpdatedAt,
    });

    const result = await invokeSchedule(waClient, schedule, scheduleContext);

    expect(result).toBe("skipped");
    expect(getMinyanById).not.toHaveBeenCalled();
    expect(scheduleContext.update).not.toHaveBeenCalled();
  });

  it("should proceed with the schedule if the last process interval time has passed", async () => {
    const mockUpdatedAt = Date.now() - 20 * 60 * 1000; // 20 minutes ago
    jest.spyOn(scheduleContext, "get").mockResolvedValue({
      updatedAt: mockUpdatedAt,
    });

    const result = await invokeSchedule(waClient, schedule, scheduleContext);

    expect(result).toBe(ScheduleStatus.initiated);
    expect(getMinyanById).toHaveBeenCalledWith(1);
    expect(scheduleContext.update).toHaveBeenCalledWith({
      invocationId: expect.any(String),
      startedAt: expect.any(Number),
      updatedAt: expect.any(Number),
      status: ScheduleStatus.initiated,
    });
  });

  it("should save schedule occurrence when invoked with context", async () => {
    jest.spyOn(scheduleContext, "get").mockResolvedValue({
      approved: { "1234567890": 1, "9876543210": 2 },
      rejected: ["1111111111"],
      snoozed: ["2222222222", "3333333333"],
      status: ScheduleStatus.processing,
    });

    await invokeSchedule(waClient, schedule, scheduleContext);

    expect(getScheduleInvocationOccurrence).toHaveBeenCalled();
    expect(saveScheduleOccurrence).toHaveBeenCalledWith(
      expect.objectContaining({
        scheduleId: 1,
        approved: 3,
        rejected: 1,
        snoozed: 2,
        invocationId: expect.any(String),
      })
    );
  });

  it("should not save schedule occurrence if values have not changed", async () => {
    const mockInvocationId = "test-invocation-id";
    jest.spyOn(scheduleContext, "get").mockResolvedValue({
      invocationId: mockInvocationId,
      approved: { "1234567890": 1 },
      rejected: [],
      snoozed: [],
      status: ScheduleStatus.processing,
    });

    (getScheduleInvocationOccurrence as jest.Mock).mockResolvedValue({
      scheduleId: 1,
      approved: 1,
      rejected: 0,
      snoozed: 0,
      invocationId: mockInvocationId,
    });

    await invokeSchedule(waClient, schedule, scheduleContext);

    expect(getScheduleInvocationOccurrence).toHaveBeenCalled();
    expect(saveScheduleOccurrence).not.toHaveBeenCalled();
  });
});
