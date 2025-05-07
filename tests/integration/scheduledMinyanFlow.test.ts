import templates from "../../src/conversation/waTemplates";
import { Prayer } from "../../src/datasource/entities/Schedule";
import {
  expectNoNewMessages,
  expectTzenterTemplateMessageSequence,
  expectTzenterTextMessage,
  expectTzenterTextMessageSequence,
  getCurrentTemplateMessageCallsCount,
  getCurrentTextMessageCallsCount,
  initMocksAndData,
  resetAll,
  scheduleExecution,
  userMessage,
} from "./integrationUtils";

const user1 = {
  phoneNum: 972547488557,
  name: "מוישה זוכמיר",
};

const user2 = {
  phoneNum: 97254345829,
  name: "אלברט איינשטין",
};

const user3 = {
  phoneNum: 972523478652,
  name: "חטפני השועל",
};

describe("minyan schedule flow", () => {
  beforeAll(async () => {
    await initMocksAndData({
      minyans: [
        {
          name: "איצקוביץ",
          city: "תל אביב",
        },
      ],
      users: [
        {
          phoneNum: user1.phoneNum,
          name: user1.name,
          minyanNames: ["איצקוביץ"],
        },
        {
          phoneNum: user2.phoneNum,
          name: user2.name,
          minyanNames: ["איצקוביץ"],
        },
        {
          phoneNum: user3.phoneNum,
          name: user3.name,
          minyanNames: ["איצקוביץ"],
        },
      ],
      schedules: [
        {
          name: "תפילת מנחה",
          prayer: Prayer.Mincha,
          time: "16:00",
          minyanName: "איצקוביץ",
        },
      ],
    });
  });

  afterAll(async () => {
    await resetAll();
  });

  it("minyan schedule started -> user gets an alert", async () => {
    await scheduleExecution("15:20");
    const expectedTemplateParams = {
      "1": "איצקוביץ",
      "2": "מנחה",
      "3": "16:00",
      "4": "-",
    };
    await expectTzenterTemplateMessageSequence([
      {
        phoneNum: user1.phoneNum,
        template: templates.minyan_appointment_reminder,
        params: expectedTemplateParams,
      },
      {
        phoneNum: user2.phoneNum,
        template: templates.minyan_appointment_reminder,
        params: expectedTemplateParams,
      },
      {
        phoneNum: user3.phoneNum,
        template: templates.minyan_appointment_reminder,
        params: expectedTemplateParams,
      },
    ]);
  });

  it("user1 approved attendees", async () => {
    await userMessage(user1.phoneNum, user1.name, "אגיע");
    await expectTzenterTextMessage(
      user1.phoneNum,
      `קיבלתי, תודה על העדכון!
אני אמשיך לעדכן אותך לגבי המניין.

במידה ותגיעו יותר מאדם אחד, בבקשה הזן את מספר הבאים (כולל אותך) עכשיו`
    );
  });

  it("user1 updated for 3 attendees", async () => {
    await userMessage(user1.phoneNum, user1.name, "3");
    await expectTzenterTextMessage(user1.phoneNum, "קיבלתי, תודה על העדכון!");
  });

  it("user2 snoozed", async () => {
    await userMessage(user2.phoneNum, user2.name, "שאל אותי מאוחר יותר");
    await expectTzenterTextMessage(
      user2.phoneNum,
      "קיבלתי, אני אשאל אותך בהמשך"
    );
  });

  it("user3 rejected", async () => {
    await userMessage(user3.phoneNum, user2.name, "לא אגיע");
    await expectTzenterTextMessage(user3.phoneNum, "קיבלתי, תודה על העדכון!");
  });

  it("minyan schedule executed again after 5 minutes -> schedule is skipped with no user notifications", async () => {
    const textMessageCount = getCurrentTextMessageCallsCount();
    const templateMessageCount = getCurrentTemplateMessageCallsCount();
    await scheduleExecution("15:25");
    expectNoNewMessages(textMessageCount, templateMessageCount);
  });

  it("minyan schedule executed again after 21 minutes -> users gets notifications", async () => {
    await scheduleExecution("15:41");
    await expectTzenterTextMessageSequence([
      {
        phoneNum: user2.phoneNum,
        message: `זוהי תזכורת לתפילת מנחה בשעה 16:00 במניין איצקוביץ

האם תגיע?`,
      },
      {
        phoneNum: user1.phoneNum,
        message: `עדכון לתפילת מנחה בשעה 16:00 במניין איצקוביץ

 נכון לרגע זה אשרו הגעה 3 מתפללים

1. מוישה זוכמיר
2. מוישה זוכמיר (2)
3. מוישה זוכמיר (3)
`,
      },
    ]);
  });

  it("user2 approved attendees", async () => {
    await userMessage(user2.phoneNum, user2.name, "כן");
    await expectTzenterTextMessage(
      user2.phoneNum,
      `קיבלתי, תודה על העדכון!
אני אמשיך לעדכן אותך לגבי המניין.

במידה ותגיעו יותר מאדם אחד, בבקשה הזן את מספר הבאים (כולל אותך) עכשיו`
    );
  });

  it("user2 updated for 8 attendees -> minimum attendees amount as reached -> all registered users gets notifications", async () => {
    await userMessage(user2.phoneNum, user2.name, "8");

    const expectedMessage = `יש מניין!

המתפללים הבאים אשרו הגעה לתפילת מנחה במניין איצקוביץ בשעה 16:00

1. מוישה זוכמיר
2. מוישה זוכמיר (2)
3. מוישה זוכמיר (3)
4. אלברט איינשטין
5. אלברט איינשטין (2)
6. אלברט איינשטין (3)
7. אלברט איינשטין (4)
8. אלברט איינשטין (5)
9. אלברט איינשטין (6)
10. אלברט איינשטין (7)
11. אלברט איינשטין (8)


בבקשה להגיע בזמן`;
    await expectTzenterTextMessageSequence([
      { phoneNum: user2.phoneNum, message: "קיבלתי, תודה על העדכון!" },
      { phoneNum: user1.phoneNum, message: expectedMessage },
      { phoneNum: user2.phoneNum, message: expectedMessage },
    ]);
  });
});
