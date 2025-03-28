import WhatsApp from "whatsapp";
import {
  ComponentTypesEnum,
  LanguagesEnum,
  ParametersTypesEnum,
} from "whatsapp/build/types/enums";

export class WhatsappClient {
  wa: WhatsApp;
  constructor(senderId: number) {
    this.wa = new WhatsApp(senderId);
    this.wa.config["DEBUG"] = process.env.DEBUG === "true";
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

    const parameters = [];
    for (const key in params) {
      parameters.push({
        type: ParametersTypesEnum.Text,
        text: String(params[key]),
      });
    }

    const resp = await this.wa.messages.template(
      {
        name,
        // @ts-ignore
        language: { code: LanguagesEnum.Hebrew },
        components: [
          {
            type: ComponentTypesEnum.Body,
            // @ts-ignore
            parameters,
          },
        ],
      },
      recipientPhoneNum
    );
    return resp.responseBodyToJSON();
  };
}
