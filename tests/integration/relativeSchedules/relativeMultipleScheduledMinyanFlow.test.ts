import templates from "../../../src/conversation/waTemplates";
import {
  Prayer,
  RelativeTime,
  WeekDay,
} from "../../../src/datasource/entities/Schedule";
import {
  expectTzenterTemplateMessageSequence,
  expectTzenterTextMessage,
  initMocksAndData,
  resetAll,
  scheduleExecution,
  timeTravelTo,
  userMessage,
} from "../integrationUtils";

const user1 = {
  phoneNum: 972547488557,
  name: "מוישה זוכמיר",
};

const testDate = new Date("2025-06-03T10:00:00");
// Zmanim data - Tue 3rd June 2025{
//   sunrise: '2025-06-03T05:34:48+03:00',
//   sunset: '2025-06-03T19:43:27+03:00'
// }

// Zmanim data - Sun 1st June 2025{
//   sunrise: '2025-06-01T05:35:16+03:00',
//   sunset: '2025-06-01T19:42:21+03:00'
// }

const testData = {
  minyans: [
    {
      name: "איצקוביץ",
      city: "תל אביב",
      latitude: 32.108,
      longitude: 34.797,
    },
    {
      name: "פנס",
      city: "רעננה",
    },
  ],
  users: [
    {
      phoneNum: user1.phoneNum,
      name: user1.name,
      minyanNames: ["איצקוביץ", "פנס"],
    },
  ],
};

describe("minyan relative schedule flow - before sunset", () => {
  beforeAll(async () => {
    timeTravelTo(new Date(testDate));

    await initMocksAndData({
      ...testData,
      schedules: [
        {
          name: "תפילת מנחה",
          prayer: Prayer.Mincha,
          time: "01:14",
          minyanName: "איצקוביץ",
          relative: RelativeTime.BEFORE_SUNSET,
          weeklyDetermineByDay: WeekDay.Sunday,
        },
        {
          name: "תפילת מנחה",
          prayer: Prayer.Mincha,
          time: "18:20",
          minyanName: "פנס",
        },
      ],
    });
  });

  afterAll(async () => {
    await resetAll();
  });

  it("minyan relative schedule started -> user gets an alert", async () => {
    await scheduleExecution("18:20");
    const expectedTemplateParams1 = {
      "1": "איצקוביץ",
      "2": "מנחה",
      "3": "18:28",
      "4": "-",
    };

    const expectedTemplateParams2 = {
      "1": "פנס",
      "2": "מנחה",
      "3": "18:20",
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

  it("user1 initiate an update - two active schedule available - only one approved - gets list of options", async () => {
    await userMessage(user1.phoneNum, user1.name, "עדכון");
    await expectTzenterTextMessage(
      user1.phoneNum,
      `יש כרגע 2 תזמונים פעילים

- לתפילת מנחה במניין איצקוביץ בשעה 18:28
- לתפילת מנחה במניין פנס בשעה 18:20

מה אתה מעוניין לעשות?

1. לעדכן את הנוכחות שלי במנחה במניין איצקוביץ
2. לעדכן את הנוכחות שלי במנחה במניין פנס
`
    );
  });

  it("user1 selects the first option - gets a message to add the updated attendees amount", async () => {
    await userMessage(user1.phoneNum, user1.name, "1");
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

  it("user1 initiate an update - two active schedule available - only one approved - gets list of options", async () => {
    await userMessage(user1.phoneNum, user1.name, "עדכון");
    await expectTzenterTextMessage(
      user1.phoneNum,
      `יש כרגע 2 תזמונים פעילים

- לתפילת מנחה במניין איצקוביץ בשעה 18:28
- לתפילת מנחה במניין פנס בשעה 18:20

מה אתה מעוניין לעשות?

1. לקבל עדכון לגבי מצב מנחה במניין איצקוביץ
2. לעדכן את הנוכחות שלי במנחה במניין איצקוביץ
3. לעדכן את הנוכחות שלי במנחה במניין פנס
`
    );
  });

  it("user1 selects the first option - gets the current minyan status of 2 approvals", async () => {
    await userMessage(user1.phoneNum, user1.name, "1");
    await expectTzenterTextMessage(
      user1.phoneNum,
      `עדכון לתפילת מנחה בשעה 18:28 במניין איצקוביץ

 נכון לרגע זה אשרו הגעה 2 מתפללים

1. מוישה זוכמיר
2. מוישה זוכמיר (2)
`
    );
  });
});
