import { errorToHttpStatusCode } from "../utils";
import { BadInputError, InvalidInputError } from "../errors";

describe('errorToHttpStatusCode', () => {
  it('should return 400 for BadInputError', () => {
    const error = new BadInputError('');
    const statusCode = errorToHttpStatusCode(error);
    expect(statusCode).toBe(400);
  });

  it('should return 422 for InvalidInputError', () => {
    const error = new InvalidInputError('');
    const statusCode = errorToHttpStatusCode(error);
    expect(statusCode).toBe(422);
  });

  it('should return 500 for generic Error', () => {
    const error = new Error();
    const statusCode = errorToHttpStatusCode(error);
    expect(statusCode).toBe(500);
  });

  it('should return 500 for unknown error types', () => {
    class UnknownError extends Error {}
    const error = new UnknownError();
    const statusCode = errorToHttpStatusCode(error);
    expect(statusCode).toBe(500);
  });
});