export type ApiClientError = Error & {
  code?: string;
  requestId?: string;
  details?: unknown;
  status?: number;
};

type ParsedApiError = Readonly<{
  message: string;
  code?: string;
  requestId?: string;
  details?: unknown;
}>;

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : null;

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value : null;

export const parseApiError = (
  payload: unknown,
  fallbackMessage: string
): ParsedApiError => {
  const payloadRecord = asRecord(payload);
  if (!payloadRecord) {
    return { message: fallbackMessage };
  }

  const nestedError = asRecord(payloadRecord.error);
  if (nestedError) {
    return {
      message: readString(nestedError.message) ?? fallbackMessage,
      code: readString(nestedError.code) ?? undefined,
      requestId: readString(nestedError.requestId) ?? undefined,
      details: nestedError.details,
    };
  }

  return {
    message: readString(payloadRecord.message) ?? fallbackMessage,
  };
};

export const getApiErrorDetails = (payload: unknown): unknown => {
  const payloadRecord = asRecord(payload);
  if (!payloadRecord) {
    return undefined;
  }

  const nestedError = asRecord(payloadRecord.error);
  if (nestedError && "details" in nestedError) {
    return nestedError.details;
  }

  return undefined;
};

export const toClientError = (
  payload: unknown,
  fallbackMessage: string,
  status?: number
): ApiClientError => {
  const parsed = parseApiError(payload, fallbackMessage);
  const error = new Error(parsed.message) as ApiClientError;
  if (parsed.code) {
    error.code = parsed.code;
  }
  if (parsed.requestId) {
    error.requestId = parsed.requestId;
  }
  if (parsed.details !== undefined) {
    error.details = parsed.details;
  }
  if (typeof status === "number") {
    error.status = status;
  }
  return error;
};
