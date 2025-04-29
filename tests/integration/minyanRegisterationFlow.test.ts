import { messages } from "../../src/conversation/messageTemplates";
import {
  expectTzenterTextMessage,
  initMocksAndData,
  userMessage,
} from "./integrationUtils";

const user = {
  phoneNum: 972547488557,
  name: "מוישה זוכמיר",
};

describe("register a minyan flow", () => {
  beforeAll(async () => {
    await initMocksAndData({
      minyans: [
        {
          name: "איצקוביץ",
          city: "תל אביב",
        },
      ],
    });
  });

  it("user trigger initial conversation", async () => {
    await userMessage(user.phoneNum, user.name, "שלום");
    await expectTzenterTextMessage(user.phoneNum, messages.INITIAL);
  });

  it("user selects register a minyan option (2) -> gets the list of available minyans", async () => {
    await userMessage(user.phoneNum, user.name, "2");
    await expectTzenterTextMessage(
      user.phoneNum,
      `המניינים הזמינים: 

1. איצקוביץ


 כדי להמשיך יש להזין את מספר המניין הרצוי`
    );
  });

  it("user selects minyan option (1) -> gets a confirmation question", async () => {
    await userMessage(user.phoneNum, user.name, "1");
    await expectTzenterTextMessage(
      user.phoneNum,
      `בחרת במניין איצקוביץ

האם אתה רוצה להירשם למניין זה?`
    );
  });

  it("user confirm registration -> gets a confirmation message for the registration", async () => {
    await userMessage(user.phoneNum, user.name, "כן");
    await expectTzenterTextMessage(
      user.phoneNum,
      `ההרשמה למניין בוצעה בהצלחה!

מעכשיו, אני אעדכן אותך לגבי תפילות שמתקיימות ושינויים שנוגעים למניין זה.`
    );
  });

  it("user reset conversation using hook word", async () => {
    await userMessage(user.phoneNum, user.name, "צענטר");
    await expectTzenterTextMessage(user.phoneNum, messages.INITIAL);
  });

  it("user selects show my minyans option (1) -> gets the list of his registered minyans", async () => {
    await userMessage(user.phoneNum, user.name, "1");
    await expectTzenterTextMessage(
      user.phoneNum,
      `המניינים שלך: 

1. איצקוביץ


 כדי להמשיך יש להזין את מספר המניין הרצוי`
    );
  });

  it("user reset conversation using hook word", async () => {
    await userMessage(user.phoneNum, user.name, "צענטר");
    await expectTzenterTextMessage(user.phoneNum, messages.INITIAL);
  });

  it("user selects register a minyan option (2) -> gets the list of available minyans, with the registered minyan mark", async () => {
    await userMessage(user.phoneNum, user.name, "2");
    await expectTzenterTextMessage(
      user.phoneNum,
      `המניינים הזמינים: 

1. איצקוביץ *


 כדי להמשיך יש להזין את מספר המניין הרצוי`
    );
  });

  it("user selects minyan option (1) -> already registered -> gets a unregister question", async () => {
    await userMessage(user.phoneNum, user.name, "1");
    await expectTzenterTextMessage(
      user.phoneNum,
      `בחרת במניין איצקוביץ

אתה רשום למניין זה, האם אתה מעוניין להסיר את ההרשמה?`
    );
  });

  it("user confirm un-registration -> gets a confirmation message for the-registration", async () => {
    await userMessage(user.phoneNum, user.name, "כן");
    await expectTzenterTextMessage(user.phoneNum, "ההרשמה למניין הוסרה בהצלחה");
  });

  it("user reset conversation using hook word", async () => {
    await userMessage(user.phoneNum, user.name, "צענטר");
    await expectTzenterTextMessage(user.phoneNum, messages.INITIAL);
  });

  it("user selects show my minyans option (1) -> gets a message that he's not registered to any minyan", async () => {
    await userMessage(user.phoneNum, user.name, "1");
    await expectTzenterTextMessage(
      user.phoneNum,
      `אתה לא רשום כרגע לאף מניין

האם אתה מעוניין להירשם?`
    );
  });
});
