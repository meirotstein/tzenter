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
import {
  Prayer,
  RelativeTime,
  Schedule,
  WeekDay,
} from "../../src/datasource/entities/Schedule";
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
    latitude?: number;
    longitude?: number;
  }>;
  schedules?: Array<{
    name: string;
    prayer: Prayer;
    time: string;
    minyanName: string;
    relative?: RelativeTime;
    weeklyDetermineByDay?: WeekDay;
    roundToNearestFiveMinutes?: boolean;
    weekDays?: WeekDay[];
    startAt?: Date;
    endAt?: Date;
    config?: number;
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
      minyan.latitude = minyanData.latitude;
      minyan.longitude = minyanData.longitude;
      await saveMinyan(minyan);
    }
  }

  if (data.schedules?.length) {
    for (const scheduleData of data.schedules) {
      const schedule = new Schedule();
      schedule.name = scheduleData.name;
      schedule.prayer = scheduleData.prayer;
      schedule.time = scheduleData.time;
      schedule.relative = scheduleData.relative;
      schedule.roundToNearestFiveMinutes =
        scheduleData.roundToNearestFiveMinutes;
      schedule.weeklyDetermineByDay = scheduleData.weeklyDetermineByDay;
      schedule.config = scheduleData.config;
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

  await (await getMinyanRepo()).clear();
  await (await getScheduleRepo()).clear();
  await (await getUsersRepo()).clear();

  jest.useRealTimers();
  jest.clearAllMocks();

  kvMock.clear();
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

export async function userButtonReply(
  phoneNum: number,
  userName: string,
  message: string,
  payload?: string
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
                  type: WebhookTypesEnum.Button,
                  button: {
                    text: message,
                    payload: payload || message,
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
    replyIds?: Array<string>;
  }>,
  forceOrder: boolean = true
) {
  if (forceOrder) {
    // Original behavior - check messages in exact order
    msgs.forEach(({ phoneNum, template, params, replyIds }, idx) => {
      let lastCallArgs =
        sendTemplateMessageMock.mock.calls[
          sendTemplateMessageMock.mock.calls.length - msgs.length + idx
        ];
      expect(lastCallArgs).toEqual([phoneNum, template, params, replyIds]);
    });
  } else {
    // Order-insensitive matching - check that all messages exist in any order
    const totalCalls = sendTemplateMessageMock.mock.calls.length;
    const expectedCount = msgs.length;
    const actualCalls = sendTemplateMessageMock.mock.calls.slice(
      totalCalls - expectedCount
    );

    // Create a copy of expected messages to track which ones we've matched
    const remainingMsgs = [...msgs];

    // For each actual call, try to find a matching expected message
    for (const actualCall of actualCalls) {
      const [actualPhoneNum, actualTemplate, actualParams, actualReplyIds] =
        actualCall;

      // Find a matching expected message
      const matchingIndex = remainingMsgs.findIndex(
        (expectedMsg) =>
          expectedMsg.phoneNum === actualPhoneNum &&
          expectedMsg.template === actualTemplate &&
          JSON.stringify(expectedMsg.params) === JSON.stringify(actualParams) &&
          JSON.stringify(expectedMsg.replyIds) ===
            JSON.stringify(actualReplyIds)
      );

      if (matchingIndex === -1) {
        // No matching message found
        expect(actualCall).toEqual([
          actualPhoneNum,
          actualTemplate,
          actualParams,
          actualReplyIds,
        ]);
        throw new Error(
          `No matching expected message found for call: ${JSON.stringify(
            actualCall
          )}`
        );
      }

      // Remove the matched message from remaining messages
      remainingMsgs.splice(matchingIndex, 1);
    }

    // Check that all expected messages were matched
    if (remainingMsgs.length > 0) {
      throw new Error(
        `Some expected messages were not found: ${JSON.stringify(
          remainingMsgs
        )}`
      );
    }
  }
}
