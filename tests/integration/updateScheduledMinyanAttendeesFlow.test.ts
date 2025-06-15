import { messages } from "../../src/conversation/messageTemplates";
import templates from "../../src/conversation/waTemplates";
import { Prayer } from "../../src/datasource/entities/Schedule";
import {
  expectTzenterTemplateMessageSequence,
  expectTzenterTextMessage,
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

  it("user1 initiate an update - no active schedule - user gets a message", async () => {
    await userMessage(user1.phoneNum, user1.name, "עדכון");
    await expectTzenterTextMessage(
      user1.phoneNum,
      "אין כרגע תזמונים פעילים למניינים שנרשמת אליהם"
    );
  });

  it("minyan schedule started -> users gets an alert", async () => {
    await scheduleExecution("15:20");
    const expectedTemplateParams = {
      "1": "איצקוביץ",
      "2": "מנחה",
      "3": "16:00",
      "4": "-",
    };
    const expectedReplyIds = ["approve:1", "reject:1", "snooze:1"];
    await expectTzenterTemplateMessageSequence([
      {
        phoneNum: user1.phoneNum,
        template: templates.minyan_appointment_reminder,
        params: expectedTemplateParams,
        replyIds: expectedReplyIds,
      },
      {
        phoneNum: user2.phoneNum,
        template: templates.minyan_appointment_reminder,
        params: expectedTemplateParams,
        replyIds: expectedReplyIds,
      },
      {
        phoneNum: user3.phoneNum,
        template: templates.minyan_appointment_reminder,
        params: expectedTemplateParams,
        replyIds: expectedReplyIds,
      },
    ]);
  });

  it("user1 approved attendees", async () => {
    await userMessage(user1.phoneNum, user1.name, "אגיע");
    await expectTzenterTextMessage(
      user1.phoneNum,
      `קיבלתי, תודה על העדכון!
אני אמשיך לעדכן אותך לגבי המניין.

במידה ותגיעו יותר מאדם אחד, בבקשה הזן את מספר הבאים (כולל אותך) עכשיו

בכדי להתעדכן במצב המניין, או לעדכן את הנוכחות בכל שלב - פשוט תכתוב *עדכון*`
    );
  });

  it("user1 updated for 3 attendees", async () => {
    await userMessage(user1.phoneNum, user1.name, "3");
    await expectTzenterTextMessage(user1.phoneNum, "קיבלתי, תודה על העדכון!");
  });

  it("user1 initiate an update - one active schedule available - gets list of options", async () => {
    await userMessage(user1.phoneNum, user1.name, "עדכון");
    await expectTzenterTextMessage(
      user1.phoneNum,
      `יש כרגע תזמון פעיל לתפילת מנחה במניין איצקוביץ בשעה 16:00

מה אתה מעוניין לעשות?

1. לקבל עדכון לגבי מצב המניין
2. לעדכן את הנוכחות שלי`
    );
  });

  it("user1 selects the first option - gets the current minyan status of 3 approvals", async () => {
    await userMessage(user1.phoneNum, user1.name, "1");
    await expectTzenterTextMessage(
      user1.phoneNum,
      `עדכון לתפילת מנחה בשעה 16:00 במניין איצקוביץ

 נכון לרגע זה אשרו הגעה 3 מתפללים

1. מוישה זוכמיר
2. מוישה זוכמיר (2)
3. מוישה זוכמיר (3)
`
    );
  });

  it("user1 initiate an update - one active schedule available - gets list of options", async () => {
    await userMessage(user1.phoneNum, user1.name, "עדכון");
    await expectTzenterTextMessage(
      user1.phoneNum,
      `יש כרגע תזמון פעיל לתפילת מנחה במניין איצקוביץ בשעה 16:00

מה אתה מעוניין לעשות?

1. לקבל עדכון לגבי מצב המניין
2. לעדכן את הנוכחות שלי`
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

  it("user1 initiate an update - one active schedule available - gets list of options", async () => {
    await userMessage(user1.phoneNum, user1.name, "עדכון");
    await expectTzenterTextMessage(
      user1.phoneNum,
      `יש כרגע תזמון פעיל לתפילת מנחה במניין איצקוביץ בשעה 16:00

מה אתה מעוניין לעשות?

1. לקבל עדכון לגבי מצב המניין
2. לעדכן את הנוכחות שלי`
    );
  });

  it("user1 selects the first option - gets the current minyan status of 2 approvals", async () => {
    await userMessage(user1.phoneNum, user1.name, "1");
    await expectTzenterTextMessage(
      user1.phoneNum,
      `עדכון לתפילת מנחה בשעה 16:00 במניין איצקוביץ

 נכון לרגע זה אשרו הגעה 2 מתפללים

1. מוישה זוכמיר
2. מוישה זוכמיר (2)
`
    );
  });

  it("user1 initiate an update - one active schedule available - gets list of options", async () => {
    await userMessage(user1.phoneNum, user1.name, "עדכון");
    await expectTzenterTextMessage(
      user1.phoneNum,
      `יש כרגע תזמון פעיל לתפילת מנחה במניין איצקוביץ בשעה 16:00

מה אתה מעוניין לעשות?

1. לקבל עדכון לגבי מצב המניין
2. לעדכן את הנוכחות שלי`
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

  it("user1 updated for no attendees (0)", async () => {
    await userMessage(user1.phoneNum, user1.name, "0");
    await expectTzenterTextMessage(user1.phoneNum, "קיבלתי, תודה על העדכון!");
  });

  it("user1 initiate an update - one active schedule available - he didnt approved - asked if want to join", async () => {
    await userMessage(user1.phoneNum, user1.name, "עדכון");
    await expectTzenterTextMessage(
      user1.phoneNum,
      `יש כרגע תזמון פעיל לתפילת מנחה במניין איצקוביץ בשעה 16:00

האם אתה מעוניין לאשר הגעה?`
    );
  });

  it("user1 answers yes - gets a confirmation and asks to update attendees", async () => {
    await userMessage(user1.phoneNum, user1.name, "כן");
    await expectTzenterTextMessage(
      user1.phoneNum,
      `קיבלתי, תודה על העדכון!
אני אמשיך לעדכן אותך לגבי המניין.

במידה ותגיעו יותר מאדם אחד, בבקשה הזן את מספר הבאים (כולל אותך) עכשיו

בכדי להתעדכן במצב המניין, או לעדכן את הנוכחות בכל שלב - פשוט תכתוב *עדכון*`
    );
  });

  it("user1 update attendees to 5 - gets a confirmation", async () => {
    await userMessage(user1.phoneNum, user1.name, "5");
    await expectTzenterTextMessage(user1.phoneNum, "קיבלתי, תודה על העדכון!");
  });

  it("user1 call initiate new conversation using hook word", async () => {
    await userMessage(user1.phoneNum, user1.name, "צענטר");
    await expectTzenterTextMessage(user1.phoneNum, messages.INITIAL);
  });

  it("user1 selects update option - one active schedule available - gets list of options", async () => {
    await userMessage(user1.phoneNum, user1.name, "3");
    await expectTzenterTextMessage(
      user1.phoneNum,
      `יש כרגע תזמון פעיל לתפילת מנחה במניין איצקוביץ בשעה 16:00

מה אתה מעוניין לעשות?

1. לקבל עדכון לגבי מצב המניין
2. לעדכן את הנוכחות שלי`
    );
  });

  it("user1 selects the first option - gets the current minyan status of 5 approvals", async () => {
    await userMessage(user1.phoneNum, user1.name, "1");
    await expectTzenterTextMessage(
      user1.phoneNum,
      `עדכון לתפילת מנחה בשעה 16:00 במניין איצקוביץ

 נכון לרגע זה אשרו הגעה 5 מתפללים

1. מוישה זוכמיר
2. מוישה זוכמיר (2)
3. מוישה זוכמיר (3)
4. מוישה זוכמיר (4)
5. מוישה זוכמיר (5)
`
    );
  });
});
