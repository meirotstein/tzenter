import { Redis } from "@upstash/redis";
import { KVClient } from "../../src/clients/KVClient";

jest.mock("@upstash/redis");

describe("KVClient", () => {
  let kvClient: KVClient;
  let redisMock: jest.Mocked<Redis>;

  beforeEach(() => {
    jest.resetAllMocks();
    redisMock = new Redis({ url: "", token: "" }) as jest.Mocked<Redis>;
    kvClient = new KVClient("test-token", "test-url");
    kvClient["redis"] = redisMock;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should set a value with expiration", async () => {
    Redis.prototype.set = jest.fn().mockResolvedValue("OK");

    await kvClient.set("test-key", { foo: "bar" }, 600);

    expect(redisMock.set).toHaveBeenCalledWith(
      "test-key",
      { foo: "bar" },
      { ex: 600 }
    );
  });

  it("should get a value", async () => {
    const value = { foo: "bar" };
    Redis.prototype.get = jest.fn().mockResolvedValue(value);

    const result = await kvClient.get("test-key");

    expect(result).toEqual(value);
  });

  it("should return null if key does not exist", async () => {
    Redis.prototype.get = jest.fn().mockResolvedValue(null);

    const result = await kvClient.get("non-existent-key");

    expect(result).toBeNull();
  });

  it("should set a value with default expiration", async () => {
    Redis.prototype.set = jest.fn().mockResolvedValue("OK");

    await kvClient.set("test-key", { foo: "bar" });

    expect(redisMock.set).toHaveBeenCalledWith(
      "test-key",
      { foo: "bar" },
      { ex: 600 }
    );
  });
});
