import { WhatsappClient } from "../../src/clients/WhatsappClient";

global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({}),
  })
) as jest.Mock;

describe("WhatsappClient", () => {
  const accessToken = "testAccessToken";
  const senderId = "testSenderId";
  const recipientPhoneNum = "1234567890";
  const textMessage = "Hello, World!";
  let whatsappClient: WhatsappClient;

  beforeEach(() => {
    whatsappClient = new WhatsappClient(accessToken, senderId);
    (fetch as jest.Mock).mockClear();
  });

  it("should send a text message", async () => {
    await whatsappClient.sendTextMessage(recipientPhoneNum, textMessage);

    expect(fetch).toHaveBeenCalledWith(
      `https://graph.facebook.com/v22.0/${senderId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: recipientPhoneNum,
          type: "text",
          text: { body: textMessage, preview_url: true },
        }),
      }
    );
  });

  it("should handle fetch errors gracefully", async () => {
    (fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.reject(new Error("Network error"))
    );

    await expect(
      whatsappClient.sendTextMessage(recipientPhoneNum, textMessage)
    ).rejects.toThrow("Network error");
  });
});
