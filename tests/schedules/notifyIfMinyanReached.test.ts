import { WhatsappClient } from "../../src/clients/WhatsappClient";
import { Context } from "../../src/conversation/context";
import { notifyMinyanHasReachedStep } from "../../src/conversation/steps/notifyMinyanHasReachedStep";
import { Prayer, Schedule } from "../../src/datasource/entities/Schedule";
import { getUserByPhone } from "../../src/datasource/usersRepository";
import { notifyIfMinyanReached } from "../../src/schedule/notifyIfMinyanReached";
import { calculatedAttendees } from "../../src/utils";

jest.mock("../../src/clients/WhatsappClient");
jest.mock("../../src/conversation/context");
jest.mock("../../src/datasource/usersRepository");
jest.mock("../../src/conversation/steps/notifyMinyanHasReachedStep");
jest.mock("../../src/utils");

describe("notifyIfMinyanReached", () => {
  let waClient: WhatsappClient;
  let schedule: Schedule;
  let context: Context<any>;

  beforeEach(() => {
    waClient = {} as WhatsappClient;
    schedule = {
      id: 1,
      name: "Test Schedule",
      prayer: Prayer.Shacharit,
      time: "",
      enabled: true,
      minyan: { id: 1, name: "", city: "", users: [] },
    } as Schedule;
    context = {
      get: jest.fn(),
      update: jest.fn(),
    } as unknown as Context<any>;

    jest.clearAllMocks();
  });

  it("should skip if no context is found", async () => {
    (context.get as jest.Mock).mockResolvedValue(null);

    const result = await notifyIfMinyanReached(waClient, schedule, context);

    expect(result).toBe("skipped");
    expect(context.get).toHaveBeenCalled();
  });

  it("should throw an error if minyan is not found", async () => {
    (context.get as jest.Mock).mockResolvedValue({
      approved: { "123456789": true },
      notified: false,
    });
    //@ts-ignore
    schedule.minyan = null;

    await expect(
      notifyIfMinyanReached(waClient, schedule, context)
    ).rejects.toThrow("Minyan with not found");
  });

  it("should notify users if minyan is reached and not notified", async () => {
    const mockUser1 = { phone: "123456789" };
    const mockUser2 = { phone: "987654321" };
    (context.get as jest.Mock).mockResolvedValue({
      approved: { [mockUser1.phone]: 1, [mockUser2.phone]: 3 },
      notified: false,
    });
    (calculatedAttendees as jest.Mock).mockReturnValue(10);
    (getUserByPhone as jest.Mock).mockResolvedValueOnce(mockUser1);
    (getUserByPhone as jest.Mock).mockResolvedValueOnce(mockUser2);
    (notifyMinyanHasReachedStep.action as jest.Mock).mockResolvedValue(
      undefined
    );
    (Context.getContext as jest.Mock).mockReturnValue({
      set: jest.fn(),
      get: jest.fn().mockResolvedValue({
        schedule,
        minyan: schedule.minyan,
      }),
    });

    const result = await notifyIfMinyanReached(waClient, schedule, context);

    expect(result).toBe("done");
    expect(context.update).toHaveBeenCalledWith({ notified: true });
    expect(notifyMinyanHasReachedStep.action).toHaveBeenCalledWith(
      +mockUser1.phone,
      waClient,
      {},
      expect.anything()
    );
    expect(notifyMinyanHasReachedStep.action).toHaveBeenCalledWith(
      +mockUser2.phone,
      waClient,
      {},
      expect.anything()
    );
  });

  it("should not notify only initiated user if already notified", async () => {
    const mockUser1 = { phone: "123456789" };
    const mockUser2 = { phone: "987654321" };
    (context.get as jest.Mock).mockResolvedValue({
      approved: { [mockUser1.phone]: 1 },
      notified: true,
    });
    (calculatedAttendees as jest.Mock).mockReturnValue(10);
    (getUserByPhone as jest.Mock).mockImplementation((phone) =>
      phone === mockUser1.phone ? mockUser1 : mockUser2
    );
    (Context.getContext as jest.Mock).mockReturnValue({
      set: jest.fn(),
      get: jest.fn().mockResolvedValue({
        schedule,
        minyan: schedule.minyan,
      }),
    });

    const result = await notifyIfMinyanReached(
      waClient,
      schedule,
      context,
      mockUser2.phone
    );

    expect(result).toBe("done");
    expect(context.update).not.toHaveBeenCalled();
    expect(notifyMinyanHasReachedStep.action).toHaveBeenCalledWith(
      +mockUser2.phone,
      waClient,
      {},
      expect.anything()
    );
    expect(notifyMinyanHasReachedStep.action).not.toHaveBeenCalledWith(
      +mockUser1.phone,
      waClient,
      {},
      expect.anything()
    );
  });

  it("should handle missing users gracefully", async () => {
    (context.get as jest.Mock).mockResolvedValue({
      approved: { "123456789": true, "987654321": true },
      notified: false,
    });
    (calculatedAttendees as jest.Mock).mockReturnValue(10);
    (getUserByPhone as jest.Mock).mockImplementation((phone) =>
      phone === "123456789" ? { phone } : null
    );
    (notifyMinyanHasReachedStep.action as jest.Mock).mockResolvedValue(
      undefined
    );
    (Context.getContext as jest.Mock).mockReturnValue({
      set: jest.fn(),
      get: jest.fn().mockResolvedValue({
        schedule,
        minyan: schedule.minyan,
      }),
    });

    const result = await notifyIfMinyanReached(waClient, schedule, context);

    expect(result).toBe("done");
    expect(context.update).toHaveBeenCalledWith({ notified: true });
    expect(notifyMinyanHasReachedStep.action).toHaveBeenCalledWith(
      123456789,
      waClient,
      {},
      expect.anything()
    );
    expect(notifyMinyanHasReachedStep.action).not.toHaveBeenCalledWith(
      987654321,
      waClient,
      {},
      expect.anything()
    );
  });
});
