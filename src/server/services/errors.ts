// src/server/services/errors.ts
export class ServiceError extends Error {
  code: string;
  httpStatus: number;

  constructor(code: string, message: string, httpStatus = 400) {
    super(message);
    this.code = code;
    this.httpStatus = httpStatus;
  }
}

// Tạo sẵn vài lỗi hay dùng
export const ERR = {
  UNAUTHORIZED: (msg = "Unauthorized") =>
    new ServiceError("UNAUTHORIZED", msg, 401),
  FORBIDDEN: (msg = "Forbidden") => new ServiceError("FORBIDDEN", msg, 403),
  NOT_FOUND: (msg = "NotFound") => new ServiceError("NOT_FOUND", msg, 404),
  CONFLICT: (msg = "Conflict") => new ServiceError("CONFLICT", msg, 409),
  INVALID: (msg = "Invalid") => new ServiceError("INVALID", msg, 400),
};
