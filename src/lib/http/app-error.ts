type AppErrorInput = Readonly<{
  status: number;
  code: string;
  message: string;
  details?: unknown;
  expose?: boolean;
  cause?: unknown;
}>;

export class AppError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;
  readonly expose: boolean;

  constructor(input: AppErrorInput) {
    super(input.message, { cause: input.cause });
    this.name = "AppError";
    this.status = input.status;
    this.code = input.code;
    this.details = input.details;
    this.expose = input.expose ?? true;
  }
}

export const isAppError = (error: unknown): error is AppError =>
  error instanceof AppError;

export const badRequestError = (
  message: string,
  options: Readonly<{ code?: string; details?: unknown; cause?: unknown }> = {}
) =>
  new AppError({
    status: 400,
    code: options.code ?? "BAD_REQUEST",
    message,
    details: options.details,
    cause: options.cause,
  });

export const unauthorizedError = (
  message = "Unauthorized.",
  options: Readonly<{ code?: string; details?: unknown; cause?: unknown }> = {}
) =>
  new AppError({
    status: 401,
    code: options.code ?? "UNAUTHORIZED",
    message,
    details: options.details,
    cause: options.cause,
  });

export const forbiddenError = (
  message = "Forbidden.",
  options: Readonly<{ code?: string; details?: unknown; cause?: unknown }> = {}
) =>
  new AppError({
    status: 403,
    code: options.code ?? "FORBIDDEN",
    message,
    details: options.details,
    cause: options.cause,
  });

export const notFoundError = (
  message: string,
  options: Readonly<{ code?: string; details?: unknown; cause?: unknown }> = {}
) =>
  new AppError({
    status: 404,
    code: options.code ?? "NOT_FOUND",
    message,
    details: options.details,
    cause: options.cause,
  });

export const conflictError = (
  message: string,
  options: Readonly<{ code?: string; details?: unknown; cause?: unknown }> = {}
) =>
  new AppError({
    status: 409,
    code: options.code ?? "CONFLICT",
    message,
    details: options.details,
    cause: options.cause,
  });

export const unprocessableEntityError = (
  message: string,
  options: Readonly<{ code?: string; details?: unknown; cause?: unknown }> = {}
) =>
  new AppError({
    status: 422,
    code: options.code ?? "UNPROCESSABLE_ENTITY",
    message,
    details: options.details,
    cause: options.cause,
  });

export const internalServerError = (
  message = "Internal server error.",
  options: Readonly<{ code?: string; details?: unknown; cause?: unknown }> = {}
) =>
  new AppError({
    status: 500,
    code: options.code ?? "INTERNAL_ERROR",
    message,
    details: options.details,
    cause: options.cause,
    expose: false,
  });
