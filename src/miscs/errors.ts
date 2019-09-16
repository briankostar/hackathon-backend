export class UserError extends Error {
  constructor(...args: any[]) {
    super(...args);
    Error.captureStackTrace(this, UserError);
  }
}

export const USER_ERRORS = {};
