import { WhatsappClient } from "../../src/clients/WhatsappClient";
import WhatsApp from "whatsapp";

jest.mock("whatsapp");

describe("WhatsappClient", () => {
  let whatsappClient: WhatsappClient;
  let mockWhatsAppInstance: jest.Mocked<WhatsApp>;

  beforeEach(() => {
    mockWhatsAppInstance = new WhatsApp(12345) as jest.Mocked<WhatsApp>;
    Object.defineProperty(mockWhatsAppInstance, "messages", {
      value: { text: jest.fn() },
      writable: true,
    });
    Object.defineProperty(mockWhatsAppInstance, "config", {
      value: {},
      writable: true,
    });
    (WhatsApp as jest.Mock).mockImplementation(() => mockWhatsAppInstance);
    whatsappClient = new WhatsappClient(12345);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should initialize WhatsApp instance with senderId", () => {
    expect(WhatsApp).toHaveBeenCalledWith(12345);
  });

  it("should send a text message", async () => {
    const recipientPhoneNum = 972547488557;
    const textMessage = "Hello, this is a test message";
    const mockResponse = {
      responseBodyToJSON: jest.fn().mockReturnValue({ success: true }),
    };

    (mockWhatsAppInstance.messages.text as jest.Mock).mockResolvedValue(
      mockResponse
    );

    const response = await whatsappClient.sendTextMessage(
      recipientPhoneNum,
      textMessage
    );

    expect(mockWhatsAppInstance.messages.text).toHaveBeenCalledWith(
      { body: textMessage },
      recipientPhoneNum
    );
    expect(mockResponse.responseBodyToJSON).toHaveBeenCalled();
    expect(response).toEqual({ success: true });
  });

  it("should handle errors when sending a text message", async () => {
    const recipientPhoneNum = 972547488557;
    const textMessage = "Hello, this is a test message";
    const mockError = new Error("Failed to send message");

    (mockWhatsAppInstance.messages.text as jest.Mock).mockRejectedValue(
      mockError
    );

    await expect(
      whatsappClient.sendTextMessage(recipientPhoneNum, textMessage)
    ).rejects.toThrow("Failed to send message");
  });
});
