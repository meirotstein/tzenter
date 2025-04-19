import { HandlerFactory } from "../../../src/handlers/HandlerFactory";
import { MessageHandler } from "../../../src/handlers/MessageHandler";
import { VerificationHandler } from "../../../src/handlers/VerificationHandler";
import { Endpoint } from "../../../src/handlers/types";

describe("HandlerFactory", () => {
  let handlerFactory: HandlerFactory;

  beforeEach(() => {
    handlerFactory = new HandlerFactory();
  });

  it("should return MessageHandler for ON_MESSAGE endpoint and POST method", () => {
    const handler = handlerFactory.getHandler(Endpoint.ON_MESSAGE, "POST");
    expect(handler).toBeInstanceOf(MessageHandler);
  });

  it("should return VerificationHandler for ON_MESSAGE endpoint and GET method", () => {
    const handler = handlerFactory.getHandler(Endpoint.ON_MESSAGE, "GET");
    expect(handler).toBeInstanceOf(VerificationHandler);
  });

  it("should return undefined for ON_MESSAGE endpoint and unsupported method", () => {
    const handler = handlerFactory.getHandler(Endpoint.ON_MESSAGE, "PUT");
    expect(handler).toBeUndefined();
  });

  it("should return undefined for unsupported endpoint", () => {
    const handler = handlerFactory.getHandler(
      "UNSUPPORTED_ENDPOINT" as Endpoint,
      "POST"
    );
    expect(handler).toBeUndefined();
  });
});
