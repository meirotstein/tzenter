import type { VercelRequest, VercelResponse } from "@vercel/node";
import manageMinyan from "../../src/api/manage-minyan";
import manageMinyanDetails from "../../src/api/manage-minyan-details";
import manageMinyanSchedules from "../../src/api/manage-minyan-schedules";
import { messages } from "../../src/conversation/messageTemplates";
import { getMinyanByName } from "../../src/datasource/minyansRepository";
import {
  expectTzenterTextMessage,
  getLastTextMessage,
  initMocksAndData,
  resetAll,
  userMessage,
} from "./integrationUtils";

jest.mock("../../src/clients/KVClient");

const user = {
  phoneNum: 972547488557,
  name: "מנהל המניין",
};

let sessionCookie = "";
let scheduleId: number | undefined;
let manageToken = "";

describe("admin manage minyan flow", () => {
  beforeAll(async () => {
    process.env.APP_BASE_URL = "https://tzenter.example";

    await initMocksAndData({
      minyans: [
        {
          name: "בית הכנסת המרכזי",
          city: "ירושלים",
          latitude: 31.778,
          longitude: 35.235,
        },
      ],
      users: [
        {
          phoneNum: user.phoneNum,
          name: user.name,
          minyanNames: ["בית הכנסת המרכזי"],
          adminMinyanNames: ["בית הכנסת המרכזי"],
        },
      ],
    });
  });

  afterAll(async () => {
    delete process.env.APP_BASE_URL;
    await resetAll();
  });

  it("shows managed minyans with an admin suffix", async () => {
    await userMessage(user.phoneNum, user.name, "שלום");
    await expectTzenterTextMessage(user.phoneNum, messages.INITIAL);

    await userMessage(user.phoneNum, user.name, "1");
    await expectTzenterTextMessage(
      user.phoneNum,
      `המניינים שלך: 

1. בית הכנסת המרכזי [מנהל]


 כדי להמשיך יש להזין את מספר המניין הרצוי`
    );
  });

  it("shows admin actions after selecting an administered minyan", async () => {
    await userMessage(user.phoneNum, user.name, "1");
    await expectTzenterTextMessage(
      user.phoneNum,
      `בחרת במניין בית הכנסת המרכזי

מה ברצונך לעשות?

1. הסר הרשמה
2. ממשק ניהול`
    );
  });

  it("sends a temporary management url and exchanges it for a session", async () => {
    await userMessage(user.phoneNum, user.name, "2");
    const manageLinkMessage = getLastTextMessage() || "";
    expect(manageLinkMessage).toContain("/manage-minyan?t=");

    const tokenMatch = manageLinkMessage.match(/manage-minyan\?t=([a-f0-9]+)/);
    expect(tokenMatch?.[1]).toBeDefined();
    manageToken = tokenMatch![1];

    const headers: Record<string, string> = {};
    const redirectRes = {
      setHeader: jest.fn((name: string, value: string) => {
        headers[name] = value;
      }),
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    } as unknown as VercelResponse;

    await manageMinyan(
      {
        method: "GET",
        query: { t: manageToken },
        headers: {},
      } as unknown as VercelRequest,
      redirectRes
    );

    expect(redirectRes.status).toHaveBeenCalledWith(302);
    expect(headers["Location"]).toBe("/manage-minyan");
    expect(headers["Set-Cookie"]).toContain("tzenter_manage_session=");
    sessionCookie = headers["Set-Cookie"].split(";")[0];

    const pageRes = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    } as unknown as VercelResponse;

    await manageMinyan(
      {
        method: "GET",
        query: {},
        headers: {
          cookie: sessionCookie,
        },
      } as unknown as VercelRequest,
      pageRes
    );

    expect(pageRes.status).toHaveBeenCalledWith(200);
    expect(pageRes.send).toHaveBeenCalledWith(
      expect.stringContaining("בית הכנסת המרכזי")
    );
  });

  it("reuses the same url while the linked session is still valid", async () => {
    const headers: Record<string, string> = {};
    const redirectRes = {
      setHeader: jest.fn((name: string, value: string) => {
        headers[name] = value;
      }),
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    } as unknown as VercelResponse;

    await manageMinyan(
      {
        method: "GET",
        query: { t: manageToken },
        headers: {},
      } as unknown as VercelRequest,
      redirectRes
    );

    expect(redirectRes.status).toHaveBeenCalledWith(302);
    expect(headers["Set-Cookie"]).toContain(sessionCookie);
  });

  it("updates minyan details through the authenticated management api", async () => {
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as VercelResponse;

    await manageMinyanDetails(
      {
        method: "PATCH",
        headers: { cookie: sessionCookie },
        body: {
          city: "בני ברק",
          latitude: "32.083",
          longitude: "34.833",
        },
      } as unknown as VercelRequest,
      res
    );

    expect(res.status).toHaveBeenCalledWith(200);
    const updatedMinyan = await getMinyanByName("בית הכנסת המרכזי");
    expect(updatedMinyan?.city).toBe("בני ברק");
  });

  it("creates, updates, and deletes schedules through the authenticated management api", async () => {
    const createRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as VercelResponse;

    await manageMinyanSchedules(
      {
        method: "POST",
        headers: { cookie: sessionCookie },
        query: {},
        body: {
          name: "שחרית יומית",
          prayer: "1",
          time: "07:15",
          enabled: true,
          roundToNearestFiveMinutes: false,
          weekDays: ["1", "2", "3"],
        },
      } as unknown as VercelRequest,
      createRes
    );

    expect(createRes.status).toHaveBeenCalledWith(201);
    const createPayload = (createRes.json as jest.Mock).mock.calls[0][0];
    scheduleId = createPayload.schedule.id;

    const updateRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as VercelResponse;

    await manageMinyanSchedules(
      {
        method: "PATCH",
        headers: { cookie: sessionCookie },
        query: { id: String(scheduleId) },
        body: {
          name: "שחרית מעודכנת",
          enabled: false,
        },
      } as unknown as VercelRequest,
      updateRes
    );

    expect(updateRes.status).toHaveBeenCalledWith(200);

    const deleteRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as VercelResponse;

    await manageMinyanSchedules(
      {
        method: "DELETE",
        headers: { cookie: sessionCookie },
        query: { id: String(scheduleId) },
      } as unknown as VercelRequest,
      deleteRes
    );

    expect(deleteRes.status).toHaveBeenCalledWith(200);
  });
});
