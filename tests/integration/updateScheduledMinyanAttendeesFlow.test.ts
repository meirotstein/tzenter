import { Prayer } from "../../src/datasource/entities/Schedule";
import {
  expectTzenterTextMessage,
  initMocksAndData,
  resetAll,
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

  it("user initiate an update - no active schedule - user gets a message", async () => {
    await userMessage(user1.phoneNum, user1.name, "עדכון");
    await expectTzenterTextMessage(
      user1.phoneNum,
      "אין כרגע תזמונים פעילים למניינים שנרשמת אליהם."
    );
  });
});
