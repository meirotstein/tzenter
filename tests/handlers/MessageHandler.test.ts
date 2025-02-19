import { MessageHandler } from "../../handlers/MessageHandler";

describe("MessageHandler", () => {
  it("handle should return a message received response", () => {
    const handler = new MessageHandler();
    const req = {
      body: {
        message: "Hello, world!",
      },
    };
    const res = handler.handle(req);
    expect(res).toEqual({ status: "Message received" });
  });
});
