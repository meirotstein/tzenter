import onMessage from "../../src/api/onMessage";

describe.skip("onMessage API", () => {
  it("should handle valid message input correctly", async () => {
    const mockMessage = { type: "VALID_TYPE", payload: { key: "value" } };
    const mockResponse = { success: true };

    const result = await onMessage(mockMessage);

    expect(result).toEqual(mockResponse);
  });
});
