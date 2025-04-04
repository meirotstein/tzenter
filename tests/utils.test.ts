import { Prayer } from "../src/datasource/entities/Schedule";
import { BadInputError, InvalidInputError } from "../src/errors";
import { WebhookObject } from "../src/external/whatsapp/types/webhooks";
import { WAMessageType } from "../src/handlers/types";
import {
  errorToHttpStatusCode,
  extractTextFromMessage,
  isAtLeastMinApart,
  prayerHebName,
} from "../src/utils";

describe("utils tests", () => {
  describe("errorToHttpStatusCode", () => {
    it("should return 400 for BadInputError", () => {
      const error = new BadInputError("");
      const statusCode = errorToHttpStatusCode(error);
      expect(statusCode).toBe(400);
    });

    it("should return 422 for InvalidInputError", () => {
      const error = new InvalidInputError("");
      const statusCode = errorToHttpStatusCode(error);
      expect(statusCode).toBe(422);
    });

    it("should return 500 for generic Error", () => {
      const error = new Error();
      const statusCode = errorToHttpStatusCode(error);
      expect(statusCode).toBe(500);
    });

    it("should return 500 for unknown error types", () => {
      class UnknownError extends Error {}
      const error = new UnknownError();
      const statusCode = errorToHttpStatusCode(error);
      expect(statusCode).toBe(500);
    });
  });

  describe("extractTextMessage", () => {
    it("should return undefined for invalid message structure", () => {
      const message: WebhookObject = { entry: [] } as unknown as WebhookObject;
      const result = extractTextFromMessage(message);
      expect(result).toBeUndefined();
    });

    it("should extract text message correctly", () => {
      const message = {
        entry: [
          {
            changes: [
              {
                value: {
                  messages: [
                    {
                      from: "972547488557",
                      id: "message-id",
                      timestamp: "timestamp",
                      text: { body: "message body" },
                      type: "text",
                    },
                  ],
                  contacts: [
                    {
                      wa_id: "phone-number",
                      profile: { name: "contact name" },
                    },
                  ],
                },
              },
            ],
          },
        ],
      } as unknown as WebhookObject;
      const result = extractTextFromMessage(message);
      expect(result).toEqual({
        type: WAMessageType.TEXT,
        id: "message-id",
        recipient: {
          phoneNum: "phone-number",
          name: "contact name",
        },
        timestamp: "timestamp",
        message: "message body",
      });
    });

    it("should extract button message correctly", () => {
      const message = {
        entry: [
          {
            changes: [
              {
                value: {
                  messages: [
                    {
                      from: "972547488557",
                      id: "message-id",
                      timestamp: "timestamp",
                      button: {
                        payload: "button payload",
                        text: "button text",
                      },
                      type: "button",
                    },
                  ],
                  contacts: [
                    {
                      wa_id: "phone-number",
                      profile: { name: "contact name" },
                    },
                  ],
                },
              },
            ],
          },
        ],
      } as unknown as WebhookObject;
      const result = extractTextFromMessage(message);
      expect(result).toEqual({
        type: WAMessageType.TEMPLATE,
        id: "message-id",
        recipient: {
          phoneNum: "phone-number",
          name: "contact name",
        },
        timestamp: "timestamp",
        message: "button text",
      });
    });

    it("should return undefined if message type is not supported", () => {
      const message = {
        entry: [
          {
            changes: [
              {
                value: {
                  messages: [
                    {
                      from: "972547488557",
                      id: "message-id",
                      timestamp: "timestamp",
                      kookoo: {
                        payload: "kookoo payload",
                        text: "kookoo text",
                      },
                      type: "kookoo",
                    },
                  ],
                  contacts: [
                    {
                      wa_id: "phone-number",
                      profile: { name: "contact name" },
                    },
                  ],
                },
              },
            ],
          },
        ],
      } as unknown as WebhookObject;
      const result = extractTextFromMessage(message);
      expect(result).toBeUndefined();
    });

    it("should return undefined if messages array is missing", () => {
      const message = {
        entry: [
          {
            changes: [
              {
                value: {
                  contacts: [
                    {
                      wa_id: "phone-number",
                      profile: { name: "contact name" },
                    },
                  ],
                },
              },
            ],
          },
        ],
      } as unknown as WebhookObject;
      const result = extractTextFromMessage(message);
      expect(result).toBeUndefined();
    });

    it("should return undefined if contacts array is missing", () => {
      const message = {
        entry: [
          {
            changes: [
              {
                value: {
                  messages: [
                    {
                      id: "message-id",
                      timestamp: "timestamp",
                      text: { body: "message body" },
                    },
                  ],
                },
              },
            ],
          },
        ],
      } as unknown as WebhookObject;
      const result = extractTextFromMessage(message);
      expect(result).toBeUndefined();
    });
  });

  describe("prayerHebName", () => {
    it("should return 'שחרית' for Prayer.Shacharit", () => {
      const result = prayerHebName(Prayer.Shacharit);
      expect(result).toBe("שחרית");
    });

    it("should return 'מנחה' for Prayer.Mincha", () => {
      const result = prayerHebName(Prayer.Mincha);
      expect(result).toBe("מנחה");
    });

    it("should return 'ערבית' for any other prayer", () => {
      const result = prayerHebName(Prayer.Arvit);
      expect(result).toBe("ערבית");
    });
  });

  describe("isAtLeastMinApart", () => {
    it("should return true if the timestamps are at least the given minutes apart", () => {
      const timestamp1 = 1677664800000; // 2023-03-01T10:00:00
      const timestamp2 = 1677666600000; // 2023-03-01T10:30:00
      const result = isAtLeastMinApart(timestamp2, timestamp1, 30);
      expect(result).toBe(true);
    });

    it("should return false if the timestamps are less than the given minutes apart", () => {
      const timestamp1 = 1677664800000; // 2023-03-01T10:00:00
      const timestamp2 = 1677665700000; // 2023-03-01T10:15:00
      const result = isAtLeastMinApart(timestamp1, timestamp2, 30);
      expect(result).toBe(false);
    });

    it("should return true if the timestamps are exactly the given minutes apart", () => {
      const timestamp1 = 1677664800000; // 2023-03-01T10:00:00
      const timestamp2 = 1677666600000; // 2023-03-01T10:30:00
      const result = isAtLeastMinApart(timestamp1, timestamp2, 30);
      expect(result).toBe(true);
    });

    it("should return false if one of the timestamps is invalid", () => {
      const timestamp1 = NaN;
      const timestamp2 = 1677666600000; // 2023-03-01T10:30:00
      const result = isAtLeastMinApart(timestamp1, timestamp2, 30);
      expect(result).toBe(false);
    });
  });
});
