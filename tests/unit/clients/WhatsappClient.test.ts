import { WhatsappClient } from "../../../src/clients/WhatsappClient";
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

  it("should send a template message with parameters and reply IDs", async () => {
    const recipientPhoneNum = 972547488557;
    const templateName = "test_template";
    const params = { key1: "value1", key2: "value2" };
    const replyIds = ["reply1", "reply2"];
    const mockResponse = {
      responseBodyToJSON: jest.fn().mockReturnValue({ success: true }),
    };

    Object.defineProperty(mockWhatsAppInstance.messages, "template", {
      value: jest.fn().mockResolvedValue(mockResponse),
      writable: true,
    });

    const response = await whatsappClient.sendTemplateMessage(
      recipientPhoneNum,
      templateName,
      params,
      replyIds
    );

    expect(mockWhatsAppInstance.messages.template).toHaveBeenCalledWith(
      {
        name: templateName,
        language: { code: "he" }, // Assuming LanguagesEnum.Hebrew resolves to "he"
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", parameter_name: "key1", text: "value1" },
              { type: "text", parameter_name: "key2", text: "value2" },
            ],
          },
          {
            type: "button",
            sub_type: "quick_reply",
            index: 0,
            parameters: [{ type: "payload", payload: "reply1" }],
          },
          {
            type: "button",
            sub_type: "quick_reply",
            index: 1,
            parameters: [{ type: "payload", payload: "reply2" }],
          },
        ],
      },
      recipientPhoneNum
    );
    expect(mockResponse.responseBodyToJSON).toHaveBeenCalled();
    expect(response).toEqual({ success: true });
  });

  it("should send a template message without parameters or reply IDs", async () => {
    const recipientPhoneNum = 972547488557;
    const templateName = "test_template";
    const mockResponse = {
      responseBodyToJSON: jest.fn().mockReturnValue({ success: true }),
    };

    Object.defineProperty(mockWhatsAppInstance.messages, "template", {
      value: jest.fn().mockResolvedValue(mockResponse),
      writable: true,
    });

    const response = await whatsappClient.sendTemplateMessage(
      recipientPhoneNum,
      templateName
    );

    expect(mockWhatsAppInstance.messages.template).toHaveBeenCalledWith(
      {
        name: templateName,
        language: { code: "he" }, // Assuming LanguagesEnum.Hebrew resolves to "he"
        components: [
          {
            type: "body",
            parameters: [],
          },
        ],
      },
      recipientPhoneNum
    );
    expect(mockResponse.responseBodyToJSON).toHaveBeenCalled();
    expect(response).toEqual({ success: true });
  });

  it("should handle errors when sending a template message", async () => {
    const recipientPhoneNum = 972547488557;
    const templateName = "test_template";
    const mockError = new Error("Failed to send template message");

    Object.defineProperty(mockWhatsAppInstance.messages, "template", {
      value: jest.fn().mockRejectedValue(mockError),
      writable: true,
    });

    await expect(
      whatsappClient.sendTemplateMessage(recipientPhoneNum, templateName)
    ).rejects.toThrow("Failed to send template message");
  });
});
