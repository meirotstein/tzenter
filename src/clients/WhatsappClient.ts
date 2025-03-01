import WhatsApp from "whatsapp";

export class WhatsappClient {
  wa: WhatsApp;
  constructor(senderId: number) {
    this.wa =  new WhatsApp(senderId);
  }

  sendTextMessage = async (recipientPhoneNum: number, textMessage: string): Promise<Record<string, any>> => {
    console.log("sending text message", recipientPhoneNum, textMessage);

    const resp = await this.wa.messages.text({body: textMessage}, recipientPhoneNum);
    return resp.responseBodyToJSON();
  };
}

/**
 * curl -i -X POST \
  https://graph.facebook.com/v22.0/581926268335637/messages \
  -H 'Authorization: Bearer EAAHNLcXZB0kIBO3510iztXyIGfGxebJHXTZC1GM3cMdiT13xkTM3fHmJHTsJZBmRiZCRUZAe3MYKLxb4A5QLVoYo9WuS6ObJ5nbWSfycb2g1tZB5lxLZAdgBicZAUhm7XbmIBPWUHb0k36Y3M3rx4MJGGXBWtde2lL8Xk1EX4ZAfxOdia70PrSqLVYuKkXzSQI7jfQq8ZCBUd52uFOioq2UVJRe2iKwgZDZD' \
  -H 'Content-Type: application/json' \
  -d '{"messaging_product":"whatsapp","to":"972547488557","type":"text","text":{"body":"בדיקה www.rotstein.co.il/tzenter","preview_url":true}}'
 */
