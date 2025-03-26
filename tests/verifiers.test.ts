import { verifyWhatsappMessage } from "../src/verifiers";
import { UnauthorizedMessageError } from "../src/errors";
import crypto from "crypto";

describe("verifyWhatsappMessage", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should throw an error if WA_APP_SECRET is not defined", () => {
    delete process.env.WA_APP_SECRET;

    const req = {
      headers: { "x-hub-signature-256": "some-signature" },
      body: { key: "value" },
    };

    expect(() => verifyWhatsappMessage(req as any)).toThrow(
      "WA_APP_SECRET is not defined"
    );
  });

  it("should throw UnauthorizedMessageError if signature header is missing", () => {
    process.env.WA_APP_SECRET = "test-secret";

    const req = {
      headers: {},
      body: { key: "value" },
    };

    expect(() => verifyWhatsappMessage(req as any)).toThrow(
      UnauthorizedMessageError
    );
  });

  it("should throw UnauthorizedMessageError if signature header is invalid", () => {
    process.env.WA_APP_SECRET = "test-secret";

    const req = {
      headers: { "x-hub-signature-256": 123 },
      body: { key: "value" },
    };

    expect(() => verifyWhatsappMessage(req as any)).toThrow(
      UnauthorizedMessageError
    );
  });

  it("should throw UnauthorizedMessageError if request body is missing", () => {
    process.env.WA_APP_SECRET = "test-secret";

    const req = {
      headers: { "x-hub-signature-256": "some-signature" },
    };

    expect(() => verifyWhatsappMessage(req as any)).toThrowError(
      UnauthorizedMessageError
    );
  });

  it("should throw UnauthorizedMessageError if signature does not match", () => {
    process.env.WA_APP_SECRET = "test-secret";

    const req = {
      headers: { "x-hub-signature-256": "invalid-signature" },
      body: { key: "value" },
    };

    expect(() => verifyWhatsappMessage(req as any)).toThrow(
      UnauthorizedMessageError
    );
  });

  it("should not throw an error if signature matches", () => {
    process.env.WA_APP_SECRET = "test-secret";

    const body = { key: "value" };
    const hmac = crypto.createHmac("sha256", process.env.WA_APP_SECRET);
    hmac.update(JSON.stringify(body));
    const validSignature = `sha256=${hmac.digest("hex")}`;

    const req = {
      headers: { "x-hub-signature-256": validSignature },
      body,
    };

    expect(() => verifyWhatsappMessage(req as any)).not.toThrow();
  });
});