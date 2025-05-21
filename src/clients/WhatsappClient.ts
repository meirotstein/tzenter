import WhatsApp from "whatsapp";
import {
  ButtonTypesEnum,
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
    params?: Record<string, any>,
    replyIds?: string[]
  ): Promise<Record<string, any>> => {
    console.log("sending template message", recipientPhoneNum, name, params);

    const parameters = [];
    for (const key in params) {
      parameters.push({
        type: ParametersTypesEnum.Text,
        parameter_name: key,
        text: String(params[key]),
      });
    }

    const components = [
      {
        type: ComponentTypesEnum.Body,
        parameters,
      },
    ];

    if (replyIds && replyIds?.length > 0) {
      replyIds.forEach((replyId, index) => {
        components.push({
          type: ComponentTypesEnum.Button,
          sub_type: ButtonTypesEnum.QuickReply,
          index,
          parameters: [
            {
              type: ParametersTypesEnum.Payload,
              // @ts-ignore
              payload: replyId,
            },
          ],
        });
      });
    }

    const resp = await this.wa.messages.template(
      {
        name,
        // @ts-ignore
        language: { code: LanguagesEnum.Hebrew },
        // @ts-ignore
        components,
      },
      recipientPhoneNum
    );
    return resp.responseBodyToJSON();
  };
}
