import { BadInputError, InvalidInputError } from "./errors";

export function errorToHttpStatusCode(error: Error) {
  if (error instanceof BadInputError) {
    return 400;
  }
  if (error instanceof InvalidInputError) {
    return 422;
  }
  return 500;
}