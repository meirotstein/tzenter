import { DateTime } from "luxon";
import templates from "../../src/conversation/waTemplates";
import { Prayer } from "../../src/datasource/entities/Schedule";
import {
  expectTzenterTemplateMessageSequence,
  expectTzenterTextMessage,
  initMocksAndData,
  resetAll,
  scheduleExecution,
  timeTravelTo,
  userButtonReply,
  userMessage,
} from "./integrationUtils";

const user1 = {
  phoneNum: 972547488557,
  name: "מוישה זוכמיר",
};

describe("outdated minyan schedule flow", () => {
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

  it("minyan schedules started -> user gets multiple alert", async () => {
    await scheduleExecution("15:20");
    const expectedTemplateParams1 = {
      "1": "איצקוביץ",
      "2": "מנחה",
      "3": "16:00",
      "4": "-",
    };

    const expectedReplyIds1 = ["approve:1", "reject:1", "snooze:1"];
    await expectTzenterTemplateMessageSequence([
      {
        phoneNum: user1.phoneNum,
        template: templates.minyan_appointment_reminder,
        params: expectedTemplateParams1,
        replyIds: expectedReplyIds1,
      },
    ]);
  });

  it("user approves minyan schedule by clicking the template button -> gets outdated message", async () => {
    const dt = DateTime.fromObject(
      {
        hour: 16,
        minute: 6,
      },
      {
        zone: "Asia/Jerusalem",
      }
    );

    // moving time to after the schedule
    timeTravelTo(dt.toJSDate());

    await userButtonReply(user1.phoneNum, user1.name, "אגיע", "approve:1");
    await expectTzenterTextMessage(user1.phoneNum, "התזמון כבר עבר");
  });

  it("user snoozed minyan schedule by clicking the template button -> gets outdated message", async () => {
    const dt = DateTime.fromObject(
      {
        hour: 16,
        minute: 6,
      },
      {
        zone: "Asia/Jerusalem",
      }
    );

    // moving time to after the schedule
    timeTravelTo(dt.toJSDate());

    await userButtonReply(
      user1.phoneNum,
      user1.name,
      "שאל אותי מאוחר יותר",
      "snooze:1"
    );
    await expectTzenterTextMessage(user1.phoneNum, "התזמון כבר עבר");
  });

  it("user rejects minyan schedule by clicking the template button -> gets outdated message", async () => {
    const dt = DateTime.fromObject(
      {
        hour: 16,
        minute: 6,
      },
      {
        zone: "Asia/Jerusalem",
      }
    );

    // moving time to after the schedule
    timeTravelTo(dt.toJSDate());

    await userButtonReply(user1.phoneNum, user1.name, "לא אגיע", "reject:1");
    await expectTzenterTextMessage(user1.phoneNum, "התזמון כבר עבר");
  });

  it("user initiate an update - gets a message that there are no available schedules", async () => {
    await userMessage(user1.phoneNum, user1.name, "עדכון");
    await expectTzenterTextMessage(
      user1.phoneNum,
      `אין כרגע תזמונים פעילים למניינים שנרשמת אליהם`
    );
  });
});
