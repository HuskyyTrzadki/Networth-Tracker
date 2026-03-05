import { toClientError } from "./client-error";

export type ClientRequestOptions = Readonly<{
  method?: string;
  headers?: HeadersInit;
  body?: BodyInit;
  json?: unknown;
  signal?: AbortSignal;
  credentials?: RequestCredentials;
  fallbackMessage: string;
  allowStatuses?: readonly number[];
  throwOnError?: boolean;
}>;

export type ClientRequestResult = Readonly<{
  response: Response;
  payload: unknown;
}>;

const isAbortError = (error: unknown) =>
  (error instanceof DOMException && error.name === "AbortError") ||
  (typeof error === "object" &&
    error !== null &&
    "name" in error &&
    (error as { name?: unknown }).name === "AbortError");

const buildRequestInit = (
  options: ClientRequestOptions
): Readonly<RequestInit> => {
  if (options.json !== undefined && options.body !== undefined) {
    throw new Error("Use either `json` or `body` in requestJson, not both.");
  }

  const headers = new Headers(options.headers);
  if (options.json !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const hasHeaders = Array.from(headers.keys()).length > 0;

  return {
    method: options.method,
    headers: hasHeaders ? headers : undefined,
    body: options.json !== undefined ? JSON.stringify(options.json) : options.body,
    signal: options.signal,
    credentials: options.credentials,
  };
};

export async function requestJson(
  input: string,
  options: ClientRequestOptions
): Promise<ClientRequestResult> {
  let response: Response;
  try {
    response = await fetch(input, buildRequestInit(options));
  } catch (error) {
    if (isAbortError(error)) {
      throw error;
    }
    throw toClientError(null, options.fallbackMessage);
  }

  const payload = (await response.json().catch(() => null)) as unknown;
  const isAllowedStatus = options.allowStatuses?.includes(response.status) ?? false;
  const shouldThrow = options.throwOnError !== false;

  if (!response.ok && !isAllowedStatus && shouldThrow) {
    throw toClientError(payload, options.fallbackMessage, response.status);
  }

  return { response, payload };
}
