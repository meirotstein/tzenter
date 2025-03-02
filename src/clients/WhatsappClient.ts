import WhatsApp from "whatsapp";

export class WhatsappClient {
  wa: WhatsApp;
  constructor(senderId: number) {
    this.wa = new WhatsApp(senderId);
  }

  sendTextMessage = async (
    recipientPhoneNum: number,
    textMessage: string
  ): Promise<Record<string, any>> => {
    console.log("sending text message", recipientPhoneNum, textMessage);

    const resp = await this.wa.messages.text(
      { body: textMessage },
      recipientPhoneNum
    );
    return resp.responseBodyToJSON();
  };
}
