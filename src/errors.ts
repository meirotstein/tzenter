export class BadInputError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export class InvalidInputError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export class MinyanNotFoundError extends Error {
  constructor(public minyanId: string | number) {
    super(`Minyan with ID ${minyanId} not found`);
  }
}

export class UserNotFoundError extends Error {
  constructor(public userId: string | number) {
    super(`User with ID ${userId} not found`);
  }
}
