export class WhatsappClient {
  constructor(private accessToken: string, private senderId: string) {}

  sendTextMessage = async (recipientPhoneNum: string, textMessage: string) => {
    console.log("sending text message", recipientPhoneNum, textMessage);

    await fetch(`https://graph.facebook.com/v22.0/${this.senderId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: recipientPhoneNum,
        type: "text",
        text: { body: textMessage, preview_url: true },
      }),
    });
  };
}

/**
 * curl -i -X POST \
  https://graph.facebook.com/v22.0/581926268335637/messages \
  -H 'Authorization: Bearer EAAHNLcXZB0kIBO3510iztXyIGfGxebJHXTZC1GM3cMdiT13xkTM3fHmJHTsJZBmRiZCRUZAe3MYKLxb4A5QLVoYo9WuS6ObJ5nbWSfycb2g1tZB5lxLZAdgBicZAUhm7XbmIBPWUHb0k36Y3M3rx4MJGGXBWtde2lL8Xk1EX4ZAfxOdia70PrSqLVYuKkXzSQI7jfQq8ZCBUd52uFOioq2UVJRe2iKwgZDZD' \
  -H 'Content-Type: application/json' \
  -d '{"messaging_product":"whatsapp","to":"972547488557","type":"text","text":{"body":"בדיקה www.rotstein.co.il/tzenter","preview_url":true}}'
 */
