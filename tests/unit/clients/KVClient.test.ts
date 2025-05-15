import { Redis } from "@upstash/redis";
import { KVClient } from "../../../src/clients/KVClient";

jest.mock("@upstash/redis");

describe("KVClient", () => {
  let kvClient: KVClient<any>;
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

    await kvClient.set("test-key", { currentStepId: "bar" }, 1800);

    expect(redisMock.set).toHaveBeenCalledWith(
      "test-key",
      { currentStepId: "bar" },
      { ex: 1800 }
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

    await kvClient.set("test-key", { currentStepId: "bar" });

    expect(redisMock.set).toHaveBeenCalledWith(
      "test-key",
      { currentStepId: "bar" },
      { ex: 1800 }
    );
  });

  it("should delete a key", async () => {
    Redis.prototype.del = jest.fn().mockResolvedValue(1);

    await kvClient.del("test-key");

    expect(redisMock.del).toHaveBeenCalledWith("test-key");
  });

  it("should get matching keys", async () => {
    Redis.prototype.scan = jest
      .fn()
      .mockResolvedValueOnce(["1", ["key1", "key2"]])
      .mockResolvedValueOnce(["0", ["key3"]]);

    const result = await kvClient.getMatchingKeys("key*");

    expect(redisMock.scan).toHaveBeenCalledWith("0", {
      match: "key*",
      count: 100,
    });
    expect(redisMock.scan).toHaveBeenCalledWith("1", {
      match: "key*",
      count: 100,
    });
    expect(result).toEqual(["key1", "key2", "key3"]);
  });

  it("should return an empty array if no keys match", async () => {
    Redis.prototype.scan = jest.fn().mockResolvedValueOnce(["0", []]);

    const result = await kvClient.getMatchingKeys("non-existent*");

    expect(redisMock.scan).toHaveBeenCalledWith("0", {
      match: "non-existent*",
      count: 100,
    });
    expect(result).toEqual([]);
  });
});
