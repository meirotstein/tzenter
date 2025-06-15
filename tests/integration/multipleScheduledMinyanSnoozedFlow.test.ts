import templates from "../../src/conversation/waTemplates";
import { Prayer } from "../../src/datasource/entities/Schedule";
import {
  expectTzenterTemplateMessageSequence,
  expectTzenterTextMessage,
  expectTzenterTextMessageSequence,
  initMocksAndData,
  resetAll,
  scheduleExecution,
  userButtonReply,
  userMessage,
} from "./integrationUtils";

const user1 = {
  phoneNum: 972547488557,
  name: "מוישה זוכמיר",
};

describe("multiple minyan schedule flow", () => {
  beforeAll(async () => {
    await initMocksAndData({
      minyans: [
        {
          name: "איצקוביץ",
          city: "תל אביב",
        },
        {
          name: "פנס",
          city: "רעננה",
        },
        {
          name: "רחוק",
          city: "אילת",
        },
      ],
      users: [
        {
          phoneNum: user1.phoneNum,
          name: user1.name,
          minyanNames: ["איצקוביץ", "פנס"],
        },
      ],
      schedules: [
        {
          name: "תפילת מנחה",
          prayer: Prayer.Mincha,
          time: "16:00",
          minyanName: "איצקוביץ",
        },
        {
          name: "תפילת מנחה",
          prayer: Prayer.Mincha,
          time: "16:00",
          minyanName: "פנס",
        },
        {
          name: "מנין שזוכמיר לא נרשם אליו",
          prayer: Prayer.Mincha,
          time: "16:00",
          minyanName: "רחוק",
        },
      ],
    });
  });

  afterAll(async () => {
    await resetAll();
  });

  it("minyan schedules started -> user gets multiple alert", async () => {
    await scheduleExecution("15:20");
    const expectedTemplateParams1 = {
      "1": "איצקוביץ",
      "2": "מנחה",
      "3": "16:00",
      "4": "-",
    };
    const expectedTemplateParams2 = {
      "1": "פנס",
      "2": "מנחה",
      "3": "16:00",
      "4": "-",
    };
    const expectedReplyIds1 = ["approve:1", "reject:1", "snooze:1"];
    const expectedReplyIds2 = ["approve:2", "reject:2", "snooze:2"];
    await expectTzenterTemplateMessageSequence([
      {
        phoneNum: user1.phoneNum,
        template: templates.minyan_appointment_reminder,
        params: expectedTemplateParams1,
        replyIds: expectedReplyIds1,
      },
      {
        phoneNum: user1.phoneNum,
        template: templates.minyan_appointment_reminder,
        params: expectedTemplateParams2,
        replyIds: expectedReplyIds2,
      },
    ]);
  });

  it("user snoozed first minyan by clicking the template button -> gets confirmation message", async () => {
    await userButtonReply(
      user1.phoneNum,
      user1.name,
      "שאל אותי מאוחר יותר",
      "snooze:1"
    );
    await expectTzenterTextMessage(
      user1.phoneNum,
      `קיבלתי, אני אשאל אותך בהמשך`
    );
  });

  it("user1 initiate an update - two active schedule available -both are snoozed - gets list of options", async () => {
    await userMessage(user1.phoneNum, user1.name, "עדכון");
    await expectTzenterTextMessage(
      user1.phoneNum,
      `יש כרגע 2 תזמונים פעילים

- לתפילת מנחה במניין איצקוביץ בשעה 16:00
- לתפילת מנחה במניין פנס בשעה 16:00

מה אתה מעוניין לעשות?

1. לעדכן את הנוכחות שלי במנחה במניין איצקוביץ
2. לעדכן את הנוכחות שלי במנחה במניין פנס
`
    );
  });

  it("user snoozed second minyan by clicking the template button -> gets confirmation message", async () => {
    await userButtonReply(
      user1.phoneNum,
      user1.name,
      "שאל אותי מאוחר יותר",
      "snooze:2"
    );
    await expectTzenterTextMessage(
      user1.phoneNum,
      `קיבלתי, אני אשאל אותך בהמשך`
    );
  });

  it("minyan schedule executed again 20 minute before due time -> schedule is triggering all user notifications", async () => {
    await scheduleExecution("15:40");
    await expectTzenterTextMessageSequence([
      {
        phoneNum: user1.phoneNum,
        message: `זוהי תזכורת לתפילת מנחה בשעה 16:00 במניין איצקוביץ

על מנת לעדכן נוכחות כתוב *עדכון*`,
      },
      {
        phoneNum: user1.phoneNum,
        message: `זוהי תזכורת לתפילת מנחה בשעה 16:00 במניין פנס

על מנת לעדכן נוכחות כתוב *עדכון*`,
      },
    ]);
  });

  it("user1 initiate an update - two active snoozed schedule available - gets list of options", async () => {
    await userMessage(user1.phoneNum, user1.name, "עדכון");
    await expectTzenterTextMessage(
      user1.phoneNum,
      `יש כרגע 2 תזמונים פעילים

- לתפילת מנחה במניין איצקוביץ בשעה 16:00
- לתפילת מנחה במניין פנס בשעה 16:00

מה אתה מעוניין לעשות?

1. לעדכן את הנוכחות שלי במנחה במניין איצקוביץ
2. לעדכן את הנוכחות שלי במנחה במניין פנס
`
    );
  });

  it("user1 selects the second option - gets a message to add the updated attendees amount", async () => {
    await userMessage(user1.phoneNum, user1.name, "2");
    await expectTzenterTextMessage(
      user1.phoneNum,
      `הכנס את מספר המתפללים העדכני שיגיעו למניין (כולל אותך)
במידה ואתה מעוניין להסיר את ההרשמה, הכנס 0`
    );
  });

  it("user1 updated for 2 attendees", async () => {
    await userMessage(user1.phoneNum, user1.name, "2");
    await expectTzenterTextMessage(user1.phoneNum, "קיבלתי, תודה על העדכון!");
  });

  it("user1 initiate another update - two active schedule available - gets list of options", async () => {
    await userMessage(user1.phoneNum, user1.name, "עדכון");
    await expectTzenterTextMessage(
      user1.phoneNum,
      `יש כרגע 2 תזמונים פעילים

- לתפילת מנחה במניין איצקוביץ בשעה 16:00
- לתפילת מנחה במניין פנס בשעה 16:00

מה אתה מעוניין לעשות?

1. לעדכן את הנוכחות שלי במנחה במניין איצקוביץ
2. לקבל עדכון לגבי מצב מנחה במניין פנס
3. לעדכן את הנוכחות שלי במנחה במניין פנס
`
    );
  });

  it("user1 selects the third option - gets the current minyan status of 2 approvals", async () => {
    await userMessage(user1.phoneNum, user1.name, "2");
    await expectTzenterTextMessage(
      user1.phoneNum,
      `עדכון לתפילת מנחה בשעה 16:00 במניין פנס

 נכון לרגע זה אשרו הגעה 2 מתפללים

1. מוישה זוכמיר
2. מוישה זוכמיר (2)
`
    );
  });

  it("minyan schedule executed again 1 minute before due time -> last execution -> schedule is triggering all user notifications", async () => {
    await scheduleExecution("15:59");
    await expectTzenterTextMessageSequence([
      {
        phoneNum: user1.phoneNum,
        message: `זוהי תזכורת לתפילת מנחה בשעה 16:00 במניין איצקוביץ

האם תגיע?`,
      },
      {
        phoneNum: user1.phoneNum,
        message: `עדכון לתפילת מנחה בשעה 16:00 במניין פנס

 נכון לרגע זה אשרו הגעה 2 מתפללים

1. מוישה זוכמיר
2. מוישה זוכמיר (2)
`,
      },
    ]);
  });
});
