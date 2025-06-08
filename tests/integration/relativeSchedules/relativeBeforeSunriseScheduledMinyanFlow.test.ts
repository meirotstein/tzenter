import templates from "../../../src/conversation/waTemplates";
import {
  Prayer,
  RelativeTime,
} from "../../../src/datasource/entities/Schedule";
import {
  expectTzenterTemplateMessageSequence,
  initMocksAndData,
  resetAll,
  scheduleExecution,
  timeTravelTo
} from "../integrationUtils";

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

const testDate = new Date("2025-06-03T10:00:00");
// Zmanim data: {
//   sunrise: '2025-06-03T05:34:48+03:00',
//   sunset: '2025-06-03T19:43:27+03:00'
// }

const testData = {
  minyans: [
    {
      name: "איצקוביץ",
      city: "תל אביב",
      latitude: 32.108,
      longitude: 34.797,
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
};

describe("minyan relative schedule flow - before sunrise", () => {
  beforeAll(async () => {
    timeTravelTo(new Date(testDate));

    await initMocksAndData({
      ...testData,
      schedules: [
        {
          name: "תפילת שחרית",
          prayer: Prayer.Shacharit,
          time: "01:14",
          minyanName: "איצקוביץ",
          relative: RelativeTime.BEFORE_SUNRISE,
        },
      ],
    });
  });

  afterAll(async () => {
    await resetAll();
  });

  it("minyan relative schedule started -> user gets an alert", async () => {
    await scheduleExecution("03:38");
    const expectedTemplateParams = {
      "1": "איצקוביץ",
      "2": "שחרית",
      "3": "04:20",
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
});
