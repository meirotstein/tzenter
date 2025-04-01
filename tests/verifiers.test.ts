import crypto from "crypto";
import { IncomingMessage } from "http";
import getRawBody from "raw-body";
import { UnauthorizedMessageError } from "../src/errors";
import {
  verifyValidScheduleExecuter,
  verifyWhatsappMessage,
} from "../src/verifiers";

jest.mock("crypto");
jest.mock("raw-body");

describe("verifiers", () => {
  describe("verifyWhatsappMessage", () => {
    const mockReq = (
      headers: any,
      method = "POST"
    ): IncomingMessage & { headers: any } =>
      ({
        headers,
        method,
      } as IncomingMessage & { headers: any });

    beforeEach(() => {
      jest.clearAllMocks();
      process.env.WA_APP_SECRET = "test_secret";
    });

    afterEach(() => {
      delete process.env.WA_APP_SECRET;
    });

    it("should throw an error if WA_APP_SECRET is not defined", async () => {
      delete process.env.WA_APP_SECRET;
      const req = mockReq({});

      await expect(verifyWhatsappMessage(req)).rejects.toThrow(
        "WA_APP_SECRET is not defined"
      );
    });

    it("should throw UnauthorizedMessageError if signature header is missing", async () => {
      const req = mockReq({});

      await expect(verifyWhatsappMessage(req)).rejects.toThrow(
        UnauthorizedMessageError
      );
    });

    it("should throw UnauthorizedMessageError if signature header is invalid", async () => {
      const req = mockReq({ "x-hub-signature-256": 123 });

      await expect(verifyWhatsappMessage(req)).rejects.toThrow(
        UnauthorizedMessageError
      );
    });

    it("should throw UnauthorizedMessageError if signature does not match", async () => {
      const req = mockReq({
        "x-hub-signature-256": "sha256=invalid_signature",
      });
      (getRawBody as jest.Mock).mockResolvedValueOnce("test_body");
      const hmacMock = {
        update: jest.fn(),
        digest: jest.fn().mockReturnValueOnce("valid_signature"),
      };
      (crypto.createHmac as jest.Mock).mockReturnValueOnce(hmacMock);

      await expect(verifyWhatsappMessage(req)).rejects.toThrow(
        UnauthorizedMessageError
      );
      expect(hmacMock.update).toHaveBeenCalledWith("test_body");
    });

    it("should not throw if signature matches", async () => {
      const req = mockReq({ "x-hub-signature-256": "sha256=valid_signature" });
      (getRawBody as jest.Mock).mockResolvedValueOnce("test_body");
      const hmacMock = {
        update: jest.fn(),
        digest: jest.fn().mockReturnValueOnce("valid_signature"),
      };
      (crypto.createHmac as jest.Mock).mockReturnValueOnce(hmacMock);

      await expect(verifyWhatsappMessage(req)).resolves.toBeUndefined();
      expect(hmacMock.update).toHaveBeenCalledWith("test_body");
    });

    it("should return early if request method is not POST", async () => {
      const req = mockReq({}, "GET");

      await expect(verifyWhatsappMessage(req)).resolves.toBeUndefined();
    });
  });

  describe("verifyValidScheduleExecuter", () => {
    const mockReq = (
      headers: any,
      socketRemoteAddress: string | null = null
    ): IncomingMessage & {
      headers: any;
      socket?: { remoteAddress?: string };
    } =>
      ({
        headers,
        socket: { remoteAddress: socketRemoteAddress },
      } as IncomingMessage & {
        headers: any;
        socket?: { remoteAddress?: string };
      });

    beforeEach(() => {
      jest.clearAllMocks();
      process.env.SCHEDULE_ALLOWED_IPS = "127.0.0.1,192.168.1.1";
    });

    afterEach(() => {
      delete process.env.SCHEDULE_ALLOWED_IPS;
    });

    it("should throw UnauthorizedMessageError if IP is not in the allowed list", async () => {
      const req = mockReq({ "x-forwarded-for": "10.0.0.1" });

      await expect(verifyValidScheduleExecuter(req)).rejects.toThrow(
        UnauthorizedMessageError
      );
    });

    it("should not throw if IP is in the allowed list (x-forwarded-for header)", async () => {
      const req = mockReq({ "x-forwarded-for": "127.0.0.1" });

      await expect(verifyValidScheduleExecuter(req)).resolves.toBeUndefined();
    });

    it("should not throw if IP is in the allowed list (remoteAddress)", async () => {
      const req = mockReq({}, "192.168.1.1");

      await expect(verifyValidScheduleExecuter(req)).resolves.toBeUndefined();
    });

    it("should throw UnauthorizedMessageError if no IP is provided", async () => {
      const req = mockReq({}, null);

      await expect(verifyValidScheduleExecuter(req)).rejects.toThrow(
        UnauthorizedMessageError
      );
    });

    it("should handle multiple IPs in x-forwarded-for header - first IP is valid", async () => {
      const req = mockReq({ "x-forwarded-for": "127.0.0.1, 10.0.0.1" });

      await expect(verifyValidScheduleExecuter(req)).resolves.toBeUndefined();
    });

    it("should handle multiple IPs in x-forwarded-for header - first IP is not valid", async () => {
      const req = mockReq({ "x-forwarded-for": "10.0.0.1, 127.0.0.1" });

      await expect(verifyValidScheduleExecuter(req)).rejects.toThrow(
        UnauthorizedMessageError
      );
    });

    it("should throw UnauthorizedMessageError if SCHEDULE_ALLOWED_IPS is not defined", async () => {
      delete process.env.SCHEDULE_ALLOWED_IPS;
      const req = mockReq({ "x-forwarded-for": "127.0.0.1" });

      await expect(verifyValidScheduleExecuter(req)).rejects.toThrow(
        UnauthorizedMessageError
      );
    });
  });
});
