import { KVClient } from "../../src/clients/KVClient";
import { Context, ContextType } from "../../src/conversation/context";
import { UserContext } from "../../src/conversation/types";

jest.mock("../../src/clients/KVClient");

describe("Context", () => {
  const mockKVClient = KVClient as jest.MockedClass<typeof KVClient>;
  const userReferenceId = "test-user-id";
  const mockUserContext: UserContext = {
    currentStepId: "fooStep",
    context: { data: "step" },
  };

  let context: Context<UserContext>;

  beforeEach(() => {
    mockKVClient.prototype.set = jest.fn();
    mockKVClient.prototype.get = jest.fn();
    mockKVClient.prototype.del = jest.fn();
    context = new Context<UserContext>(userReferenceId, ContextType.User);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should set user context", async () => {
    await context.set(mockUserContext);

    expect(mockKVClient.prototype.set).toHaveBeenCalledWith(
      expect.stringMatching(new RegExp(`${userReferenceId}$`)),
      mockUserContext,
      1800
    );
  });

  it("should get user context", async () => {
    mockKVClient.prototype.get.mockResolvedValue(mockUserContext);

    const result = await context.get();

    expect(mockKVClient.prototype.get).toHaveBeenCalledWith(
      expect.stringMatching(new RegExp(`${userReferenceId}$`))
    );
    expect(result).toEqual(mockUserContext);
  });

  it("should return null if user context does not exist", async () => {
    mockKVClient.prototype.get.mockResolvedValue(null);

    const result = await context.get();

    expect(mockKVClient.prototype.get).toHaveBeenCalledWith(
      expect.stringMatching(new RegExp(`${userReferenceId}$`))
    );
    expect(result).toBeNull();
  });

  it("should update user context", async () => {
    const partialContext = { context: { data: "step1" } };
    const updatedContext = { ...mockUserContext, ...partialContext };

    mockKVClient.prototype.get.mockResolvedValue(mockUserContext);

    const result = await context.update(partialContext);

    expect(mockKVClient.prototype.get).toHaveBeenCalledWith(
      expect.stringMatching(new RegExp(`${userReferenceId}$`))
    );
    expect(mockKVClient.prototype.set).toHaveBeenCalledWith(
      expect.stringMatching(new RegExp(`${userReferenceId}$`)),
      updatedContext,
      1800
    );
    expect(result).toEqual(updatedContext);
  });

  it("should delete user context", async () => {
    await context.delete();

    expect(mockKVClient.prototype.del).toHaveBeenCalledWith(
      expect.stringMatching(new RegExp(`${userReferenceId}$`))
    );
  });
});
