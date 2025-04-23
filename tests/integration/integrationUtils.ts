import { VercelRequest, VercelResponse } from "@vercel/node";
import onMessage from "../../src/api/onMessage";
import { KVClient } from "../../src/clients/KVClient";
import { WhatsappClient } from "../../src/clients/WhatsappClient";
import { WebhookTypesEnum } from "../../src/external/whatsapp/types/enums";
import { WebhookObject } from "../../src/external/whatsapp/types/webhooks";
import { verifyWhatsappMessage } from "../../src/verifiers";
import { KVClientMock } from "./mocks/kvClientMock";

import { Minyan } from "../../src/datasource/entities/Minyan";
import {
  getRepo as getMinyanRepo,
  saveMinyan
} from "../../src/datasource/minyansRepository";

jest.mock("../../src/clients/WhatsappClient");
jest.mock("../../src/verifiers");
jest.mock("../../src/clients/KVClient");

const sendTextMessageMock = jest.fn();
const sendTemplateMessageMock = jest.fn();
const kvMock = new KVClientMock();

export interface IntegrationTestData {
  minyans?: Array<{
    name: string;
    city: string;
  }>;
}

export async function initMocksAndDate(data: IntegrationTestData) {
  sendTextMessageMock.mockClear();
  sendTemplateMessageMock.mockClear();

  (verifyWhatsappMessage as jest.Mock).mockResolvedValue(true);

  (KVClient as jest.Mock).mockImplementation(() => kvMock);

  (WhatsappClient as jest.Mock).mockImplementation(() => ({
    sendTextMessage: sendTextMessageMock,
    sendTemplateMessage: sendTemplateMessageMock,
  }));

  (await getMinyanRepo()).clear();

  if (data.minyans?.length) {
    for (const minyanData of data.minyans) {
      const minyan = new Minyan();
      minyan.name = minyanData.name;
      minyan.city = minyanData.city;
      await saveMinyan(minyan);
    }
  }
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
