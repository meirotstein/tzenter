import { IncomingHttpHeaders } from "http";

export enum Endpoint {
  ON_MESSAGE = "onMessage",
  ON_SCHEDULE = "onSchedule",
}

export type HandlerRequest = {
  headers?: IncomingHttpHeaders;
  query?: Record<string, string | string[]>;
  body?: Record<string, any>;
};

export type HandlerResponse = string | Record<string, any> | void;

export interface IHandler {
  handle(req: HandlerRequest): Promise<HandlerResponse>;
}

export type WATextMessage = {
  type: WAMessageType;
  id: string;
  recipient: {
    phoneNum: string;
    name: string;
  };
  timestamp: string;
  message: string | undefined;
  payload?: string;
};

export enum WAMessageType {
  TEXT = "text",
  TEMPLATE = "template",
}
