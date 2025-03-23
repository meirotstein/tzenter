import { Context } from "../../src/conversation/context";
import { KVClient } from "../../src/clients/KVClient";
import { UserContext } from "../../src/handlers/types";

jest.mock("../../src/clients/KVClient");

describe("Context", () => {
  const mockKVClient = KVClient as jest.MockedClass<typeof KVClient>;
  const userReferenceId = "test-user-id";
  const mockUserContext: UserContext = {
    currentStepId: "fooStep",
    context: { data: "step" },
  };

  let context: Context;

  beforeEach(() => {
    mockKVClient.prototype.set = jest.fn();
    mockKVClient.prototype.get = jest.fn();
    mockKVClient.prototype.del = jest.fn();
    context = new Context(userReferenceId);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should set user context", async () => {
    await context.setUserContext(mockUserContext);

    expect(mockKVClient.prototype.set).toHaveBeenCalledWith(
      userReferenceId,
      mockUserContext
    );
  });

  it("should get user context", async () => {
    mockKVClient.prototype.get.mockResolvedValue(mockUserContext);

    const result = await context.getUserContext();

    expect(mockKVClient.prototype.get).toHaveBeenCalledWith(userReferenceId);
    expect(result).toEqual(mockUserContext);
  });

  it("should return null if user context does not exist", async () => {
    mockKVClient.prototype.get.mockResolvedValue(null);

    const result = await context.getUserContext();

    expect(mockKVClient.prototype.get).toHaveBeenCalledWith(userReferenceId);
    expect(result).toBeNull();
  });

  it("should update user context", async () => {
    const partialContext = { context: { data: "step1" } };
    const updatedContext = { ...mockUserContext, ...partialContext };

    mockKVClient.prototype.get.mockResolvedValue(mockUserContext);

    const result = await context.updateUserContext(partialContext);

    expect(mockKVClient.prototype.get).toHaveBeenCalledWith(userReferenceId);
    expect(mockKVClient.prototype.set).toHaveBeenCalledWith(
      userReferenceId,
      updatedContext
    );
    expect(result).toEqual(updatedContext);
  });

  it("should delete user context", async () => {
    await context.deleteUserContext();

    expect(mockKVClient.prototype.del).toHaveBeenCalledWith(userReferenceId);
  });
});
