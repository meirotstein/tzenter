import { BadInputError, InvalidInputError } from "../../src/errors";
import { VerificationHandler } from "../../src/handlers/VerificationHandler";

describe("VerificationHandler", () => {
  it("handle should return the verification challenge", () => {
    const handler = new VerificationHandler();
    const req = {
      query: {
        "hub.challenge": "123",
        "hub.mode": "subscribe",
        "hub.verify_token": "test_token",
      },
    };
    const res = handler.handle(req);
    expect(res).toBe("123");
  });

  it("handle should throw BadInputError if query is missing", () => {
    const handler = new VerificationHandler();
    const req = {};
    expect(() => handler.handle(req)).toThrow(BadInputError);
  });

  it("handle should throw BadInputError if challenge is missing", () => {
    const handler = new VerificationHandler();
    const req = {
      query: {
        "hub.mode": "subscribe",
        "hub.verify_token": "test_token",
      },
    };
    expect(() => handler.handle(req)).toThrow(BadInputError);
  });

  it("handle should throw InvalidInputError if mode is not subscribe", () => {
    const handler = new VerificationHandler();
    const req = {
      query: {
        "hub.challenge": "123",
        "hub.mode": "not_subscribe",
        "hub.verify_token": "test_token",
      },
    };
    expect(() => handler.handle(req)).toThrow(InvalidInputError);
  });

  it("handle should throw InvalidInputError if verify_token is incorrect", () => {
    const handler = new VerificationHandler();
    const req = {
      query: {
        "hub.challenge": "123",
        "hub.mode": "subscribe",
        "hub.verify_token": "incorrect_token",
      },
    };
    expect(() => handler.handle(req)).toThrow(InvalidInputError);
  });
});
