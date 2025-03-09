export enum Endpoint {
  ON_MESSAGE = "onMessage",
}

export type HandlerRequest = {
  query?: Record<string, string | string[]>;
  body?: Record<string, any>;
};

export type HandlerResponse = string | Record<string, any> | void;

export interface IHandler {
  handle(req: HandlerRequest): Promise<HandlerResponse>;
}

export type WATextMessage = {
  type: WAMessageType,
  id: string;
  recipient: {
    phoneNum: string;
    name: string;
  };
  timestamp: string;
  message: string | undefined;
};

export enum WAMessageType {
  TEXT = "text",
  TEMPLATE = "template",
}

export type UserContext = {
  currentStepId?: string;
  context?: Record<string, any>;
}