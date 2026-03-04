import { NextResponse } from "next/server";

import { AppError, isAppError } from "./app-error";

type ErrorHeaders = HeadersInit | undefined;

type ApiErrorInput = Readonly<{
  status: number;
  code: string;
  message: string;
  details?: unknown;
  request?: Request;
  requestId?: string;
  headers?: ErrorHeaders;
}>;

type ApiErrorFromUnknownInput = Readonly<{
  error: unknown;
  request?: Request;
  headers?: ErrorHeaders;
  fallbackMessage?: string;
  fallbackCode?: string;
}>;

const readRequestId = (request?: Request, explicit?: string) => {
  if (explicit && explicit.trim().length > 0) {
    return explicit.trim();
  }

  const requestHeader = request?.headers.get("x-request-id");
  if (requestHeader && requestHeader.trim().length > 0) {
    return requestHeader.trim();
  }

  return crypto.randomUUID();
};

const withHeaders = (headers?: HeadersInit) => {
  const normalized = new Headers(headers);
  if (!normalized.has("Content-Type")) {
    normalized.set("Content-Type", "application/json; charset=utf-8");
  }
  return normalized;
};

export type ApiErrorPayload = Readonly<{
  error: Readonly<{
    code: string;
    message: string;
    requestId: string;
    details?: unknown;
  }>;
  // Backward-compatible alias until all clients switch to `error.message`.
  message: string;
}>;

export const buildApiErrorPayload = (
  code: string,
  message: string,
  requestId: string,
  details?: unknown
): ApiErrorPayload => ({
  error: {
    code,
    message,
    requestId,
    ...(details === undefined ? {} : { details }),
  },
  message,
});

export const apiError = ({
  status,
  code,
  message,
  details,
  request,
  requestId,
  headers,
}: ApiErrorInput) => {
  const resolvedRequestId = readRequestId(request, requestId);
  const responseHeaders = withHeaders(headers);
  responseHeaders.set("X-Request-Id", resolvedRequestId);

  return NextResponse.json(
    buildApiErrorPayload(code, message, resolvedRequestId, details),
    {
      status,
      headers: responseHeaders,
    }
  );
};

export const apiValidationError = (
  details: unknown,
  options: Readonly<{ request?: Request; headers?: ErrorHeaders; message?: string }> = {}
) =>
  apiError({
    status: 400,
    code: "VALIDATION_ERROR",
    message: options.message ?? "Invalid input.",
    details,
    request: options.request,
    headers: options.headers,
  });

export const apiUnauthorized = (
  options: Readonly<{ request?: Request; headers?: ErrorHeaders; message?: string }> = {}
) =>
  apiError({
    status: 401,
    code: "UNAUTHORIZED",
    message: options.message ?? "Unauthorized.",
    request: options.request,
    headers: options.headers,
  });

export const apiMethodNotAllowed = (
  allow: string,
  options: Readonly<{ request?: Request; headers?: ErrorHeaders }> = {}
) => {
  const headers = new Headers(options.headers);
  headers.set("Allow", allow);

  return apiError({
    status: 405,
    code: "METHOD_NOT_ALLOWED",
    message: "Method not allowed.",
    request: options.request,
    headers,
  });
};

const fromAppError = (error: AppError, request?: Request, headers?: ErrorHeaders) =>
  apiError({
    status: error.status,
    code: error.code,
    message:
      error.status >= 500 && !error.expose
        ? "Internal server error."
        : error.message,
    details: error.details,
    request,
    headers,
  });

export const apiFromUnknownError = ({
  error,
  request,
  headers,
  fallbackMessage = "Internal server error.",
  fallbackCode = "INTERNAL_ERROR",
}: ApiErrorFromUnknownInput) => {
  if (isAppError(error)) {
    return fromAppError(error, request, headers);
  }

  return apiError({
    status: 500,
    code: fallbackCode,
    message: fallbackMessage,
    request,
    headers,
  });
};
