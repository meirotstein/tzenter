import { VercelRequest, VercelResponse } from "@vercel/node";
import onMessage from "../../src/api/onMessage";
import { KVClient } from "../../src/clients/KVClient";
import { WhatsappClient } from "../../src/clients/WhatsappClient";
import { WebhookTypesEnum } from "../../src/external/whatsapp/types/enums";
import { WebhookObject } from "../../src/external/whatsapp/types/webhooks";
import {
  verifyValidScheduleExecuter,
  verifyWhatsappMessage,
} from "../../src/verifiers";
import { KVClientMock } from "./mocks/kvClientMock";

import { DateTime } from "luxon";
import onSchedule from "../../src/api/onSchedule";
import { Minyan } from "../../src/datasource/entities/Minyan";
import { Prayer, Schedule } from "../../src/datasource/entities/Schedule";
import { User } from "../../src/datasource/entities/User";
import {
  getMinyanByName,
  getRepo as getMinyanRepo,
  saveMinyan,
} from "../../src/datasource/minyansRepository";
import {
  addSchedule,
  getRepo as getScheduleRepo,
} from "../../src/datasource/scheduleRepository";
import {
  assignUserToAMinyan,
  getRepo as getUsersRepo,
  saveUser,
} from "../../src/datasource/usersRepository";
import { getJewishEventsOnDateWrapper } from "../../src/external/hebcal/getJewishEventsOnDateWrapper";

jest.mock("../../src/clients/WhatsappClient");
jest.mock("../../src/verifiers");
jest.mock("../../src/clients/KVClient");
jest.mock("../../src/external/hebcal/getJewishEventsOnDateWrapper");

const sendTextMessageMock = jest.fn();
const sendTemplateMessageMock = jest.fn();
const kvMock = new KVClientMock();

export interface IntegrationTestData {
  minyans?: Array<{
    name: string;
    city: string;
  }>;
  schedules?: Array<{
    name: string;
    prayer: Prayer;
    time: string;
    minyanName: string;
  }>;
  users?: Array<{
    phoneNum: number;
    name: string;
    minyanNames: Array<string>;
  }>;
}

export async function initMocksAndData(data: IntegrationTestData) {
  (verifyWhatsappMessage as jest.Mock).mockResolvedValue(true);
  (verifyValidScheduleExecuter as jest.Mock).mockResolvedValue(true);
  (getJewishEventsOnDateWrapper as jest.Mock).mockResolvedValue([]);

  (KVClient as jest.Mock).mockImplementation(() => kvMock);

  (WhatsappClient as jest.Mock).mockImplementation(() => ({
    sendTextMessage: sendTextMessageMock,
    sendTemplateMessage: sendTemplateMessageMock,
  }));

  if (data.minyans?.length) {
    for (const minyanData of data.minyans) {
      const minyan = new Minyan();
      minyan.name = minyanData.name;
      minyan.city = minyanData.city;
      await saveMinyan(minyan);
    }
  }

  if (data.schedules?.length) {
    for (const scheduleData of data.schedules) {
      const schedule = new Schedule();
      schedule.name = scheduleData.name;
      schedule.prayer = scheduleData.prayer;
      schedule.time = scheduleData.time;
      const minyan = await getMinyanByName(scheduleData.minyanName);
      schedule.minyan = minyan!;

      await addSchedule(schedule);
    }
  }

  if (data.users?.length) {
    for (const userData of data.users) {
      const user = new User();
      user.phone = userData.phoneNum.toString();
      user.name = userData.name;

      await saveUser(user);

      if (userData.minyanNames.length) {
        for (const minyanName of userData.minyanNames) {
          const minyan = await getMinyanByName(minyanName);
          await assignUserToAMinyan(user.id, minyan!.id);
        }
      }
    }
  }
}

export async function resetAll() {
  sendTextMessageMock.mockClear();
  sendTemplateMessageMock.mockClear();
  (verifyWhatsappMessage as jest.Mock).mockClear();
  (verifyValidScheduleExecuter as jest.Mock).mockClear();
  (getJewishEventsOnDateWrapper as jest.Mock).mockClear();

  (await getMinyanRepo()).clear();
  (await getScheduleRepo()).clear();
  (await getUsersRepo()).clear();

  jest.useRealTimers();
  jest.clearAllMocks();
}

export function timeTravelTo(date: Date) {
  jest.useFakeTimers().setSystemTime(date);
}

export async function userMessage(
  phoneNum: number,
  userName: string,
  message: string
) {
  const mockMessage: WebhookObject = {
    entry: [
      {
        id: "1234567890",
        changes: [
          {
            value: {
              messaging_product: "whatsapp",
              contacts: [
                {
                  wa_id: phoneNum.toString(),
                  profile: {
                    name: userName,
                  },
                },
              ],
              messages: [
                {
                  id: "1234567890",
                  type: WebhookTypesEnum.Text,
                  text: {
                    body: message,
                  },
                  timestamp: Date.now().toString(),
                },
              ],
            },
          },
        ],
      },
    ],
  } as WebhookObject;

  const req = {
    method: "POST",
    body: mockMessage,
  } as unknown as VercelRequest;

  const res = {
    status: jest.fn().mockReturnThis(),
    send: jest.fn(),
  } as unknown as VercelResponse;

  await onMessage(req, res);
}

export async function scheduleExecution(time: string) {
  const [hour, minute] = time.split(":").map(Number);

  const dt = DateTime.fromObject(
    {
      hour,
      minute,
    },
    {
      zone: "Asia/Jerusalem",
    }
  );

  timeTravelTo(dt.toJSDate());

  const req = {
    method: "GET",
    body: {},
  } as unknown as VercelRequest;

  const res = {
    status: jest.fn().mockReturnThis(),
    send: jest.fn(),
  } as unknown as VercelResponse;

  await onSchedule(req, res);
}

export async function expectTzenterTextMessage(
  phoneNum: number,
  message: string,
  isContains: boolean = false
) {
  const lastCallArgs =
    sendTextMessageMock.mock.calls[sendTextMessageMock.mock.calls.length - 1];
  expect(lastCallArgs).toEqual([
    phoneNum,
    isContains ? expect.stringContaining(message) : message,
  ]);
}

export function getCurrentTextMessageCallsCount() {
  return sendTextMessageMock.mock.calls.length;
}

export function getCurrentTemplateMessageCallsCount() {
  return sendTemplateMessageMock.mock.calls.length;
}

export function expectNoNewMessages(
  textMessageCount?: number,
  templateMessageCount?: number
) {
  if (textMessageCount !== undefined) {
    expect(sendTextMessageMock.mock.calls.length).toEqual(textMessageCount);
  }
  if (templateMessageCount !== undefined) {
    expect(sendTemplateMessageMock.mock.calls.length).toEqual(
      templateMessageCount
    );
  }
}

export async function expectTzenterTextMessageSequence(
  msgs: Array<{ phoneNum: number; message: string }>
) {
  msgs.forEach(({ phoneNum, message }, idx) => {
    let lastCallArgs =
      sendTextMessageMock.mock.calls[
        sendTextMessageMock.mock.calls.length - msgs.length + idx
      ];
    expect(lastCallArgs).toEqual([phoneNum, message]);
  });
}

export async function expectTzenterTemplateMessage(
  phoneNum: number,
  template: string,
  params: Record<string, any> = {}
) {
  const lastCallArgs =
    sendTemplateMessageMock.mock.calls[
      sendTemplateMessageMock.mock.calls.length - 1
    ];
  expect(lastCallArgs).toEqual([phoneNum, template, params]);
}

export async function expectTzenterTemplateMessageSequence(
  msgs: Array<{
    phoneNum: number;
    template: string;
    params?: Record<string, any>;
  }>
) {
  msgs.forEach(({ phoneNum, template, params }, idx) => {
    let lastCallArgs =
      sendTemplateMessageMock.mock.calls[
        sendTemplateMessageMock.mock.calls.length - msgs.length + idx
      ];
    expect(lastCallArgs).toEqual([phoneNum, template, params]);
  });
}
