import { MessageHandler } from "../../src/handlers/MessageHandler";

describe("MessageHandler", () => {
  it.skip("handle should return a message received response", () => {
    const handler = new MessageHandler();
    const req = {
      body: {
        message: "Hello, world!",
      },
    };
    const res = handler.handle(req);
    expect(res).resolves.toEqual({ status: "Message received" });
  });
});
