import { errorToHttpStatusCode, extractTextMessage } from "../src/utils";
import { BadInputError, InvalidInputError } from "../src/errors";
import { WebhookObject } from "../src/types/whatsapp/types/webhooks";
import { WebhookTypesEnum } from "../src/types/whatsapp/types/enums";

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
      const result = extractTextMessage(message);
      expect(result).toBeUndefined();
    });

    it("should extract message correctly", () => {
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
                      type: WebhookTypesEnum.Text,
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
      const result = extractTextMessage(message);
      expect(result).toEqual({
        id: "message-id",
        recipient: {
          phoneNum: "phone-number",
          name: "contact name",
        },
        timestamp: "timestamp",
        message: "message body",
      });
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
      const result = extractTextMessage(message);
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
      const result = extractTextMessage(message);
      expect(result).toBeUndefined();
    });
  });
});
