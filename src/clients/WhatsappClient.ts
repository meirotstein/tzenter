import WhatsApp from "whatsapp";
import { ComponentTypesEnum, LanguagesEnum } from "whatsapp/build/types/enums";

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

  sendTemplateMessage = async (
    recipientPhoneNum: number,
    name: string,
    params?: Record<string, any>
  ): Promise<Record<string, any>> => {
    console.log("sending template message", recipientPhoneNum, name, params);

    // TODO: add support for params - map to components (https://whatsapp.github.io/WhatsApp-Nodejs-SDK/api-reference/messages/template)

    const resp = await this.wa.messages.template(
      {
        name,
        // @ts-ignore
        language: { code: 'he_IL' },
      },
      recipientPhoneNum
    );
    return resp.responseBodyToJSON();
  };
}
