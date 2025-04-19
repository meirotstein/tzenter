import { initialMenuStep } from "../../../../src/conversation/steps/initialMenuStep";
import { WhatsappClient } from "../../../../src/clients/WhatsappClient";
import { Context } from "../../../../src/conversation/context";
import { UnexpectedUserInputError } from "../../../../src/errors";
import { dadJokeStep } from "../../../../src/conversation/steps/dadJokeStep";
import { getUserMinyansStep } from "../../../../src/conversation/steps/getUserMinyansStep";
import { listAvailableMinyansStep } from "../../../../src/conversation/steps/listAvailableMinyansStep";
import { UserContext } from "../../../../src/conversation/types";
import { WATextMessage } from "../../../../src/handlers/types";

jest.mock("../../../../src/clients/WhatsappClient");

describe("initialMenuStep", () => {
  let waClient: WhatsappClient;
  let context: Context<any>;
  const sendTextMessageMock = jest.fn();

  beforeEach(() => {
    waClient = {
      sendTextMessage: sendTextMessageMock,
    } as unknown as WhatsappClient;
    context = {} as Context<UserContext>;
  });

  describe("action", () => {
    it("should send the initial menu message", async () => {
      await initialMenuStep.action(
        12345,
        waClient,
        { message: "" } as WATextMessage,
        context
      );

      expect(sendTextMessageMock).toHaveBeenCalledWith(
        12345,
        expect.stringContaining("שלום, כאן צענטר 🤖 - התפילבוט שלך.")
      );
    });
  });

  describe("getNextStepId", () => {
    it("should return getUserMinyansStep.id when user selects '1'", async () => {
      const nextStepId = await initialMenuStep.getNextStepId("1", context);
      expect(nextStepId).toBe(getUserMinyansStep.id);
    });

    it("should return listAvailableMinyansStep.id when user selects '2'", async () => {
      const nextStepId = await initialMenuStep.getNextStepId("2", context);
      expect(nextStepId).toBe(listAvailableMinyansStep.id);
    });

    it("should return dadJokeStep.id when user selects '3'", async () => {
      const nextStepId = await initialMenuStep.getNextStepId("3", context);
      expect(nextStepId).toBe(dadJokeStep.id);
    });

    it("should throw UnexpectedUserInputError for invalid input", async () => {
      await expect(
        initialMenuStep.getNextStepId("invalid", context)
      ).rejects.toThrow(UnexpectedUserInputError);
    });
  });
});
