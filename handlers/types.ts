export enum Endpoint {
  ON_MESSAGE = "onMessage",
}

export type HandlerRequest = {
  query?: Record<string, string | string[]>;
  body?: Record<string, any>;
};

export type HandlerResponse = string | Record<string, any> | void;

export interface IHandler {
  handle(req: HandlerRequest): HandlerResponse;
}
