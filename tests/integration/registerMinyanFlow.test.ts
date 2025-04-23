import {
  expectTzenterTextMessage,
  initMocksAndDate,
  userMessage,
} from "./integrationUtils";

const user = {
  phoneNum: 972547488557,
  name: "מוישה זוכמיר",
};

describe("register a minyan flow", () => {
  beforeAll(async () => {
    await initMocksAndDate({
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
    await expectTzenterTextMessage(
      user.phoneNum,
      "שלום, כאן צענטר 🤖 - התפילבוט שלך.",
      true
    );
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
    await expectTzenterTextMessage(user.phoneNum, "בחרת במניין איצקוביץ", true);
  });

  it("user confirm registration -> gets a confirmation message for the registration", async () => {
    await userMessage(user.phoneNum, user.name, "כן");
    await expectTzenterTextMessage(
      user.phoneNum,
      "ההרשמה למניין בוצעה בהצלחה!",
      true
    );
  });

  it("user reset conversation using hook work", async () => {
    await userMessage(user.phoneNum, user.name, "צענטר");
    await expectTzenterTextMessage(
      user.phoneNum,
      "שלום, כאן צענטר 🤖 - התפילבוט שלך.",
      true
    );
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
});
