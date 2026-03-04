import { apiError } from "./api-error";

type RateLimitConfig = Readonly<{
  id: string;
  limit: number;
  windowMs: number;
}>;

type BucketRecord = Readonly<{
  count: number;
  resetAt: number;
}>;

type RateLimitHeaders = Readonly<{
  "X-RateLimit-Limit": string;
  "X-RateLimit-Remaining": string;
  "X-RateLimit-Reset": string;
}>;

type RateLimitResult =
  | Readonly<{
      ok: true;
      headers: RateLimitHeaders;
    }>
  | Readonly<{
      ok: false;
      response: Response;
    }>;

const buckets = new Map<string, BucketRecord>();

const getClientAddress = (request: Request) => {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded && forwarded.trim().length > 0) {
    const [first] = forwarded.split(",");
    return first.trim();
  }

  const cloudflare = request.headers.get("cf-connecting-ip");
  if (cloudflare && cloudflare.trim().length > 0) {
    return cloudflare.trim();
  }

  return "unknown";
};

const toHeaders = (limit: number, remaining: number, resetSeconds: number) => ({
  "X-RateLimit-Limit": String(limit),
  "X-RateLimit-Remaining": String(remaining),
  "X-RateLimit-Reset": String(resetSeconds),
});

const upsertBucket = (key: string, limit: number, windowMs: number) => {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    const fresh = { count: 1, resetAt: now + windowMs } as const;
    buckets.set(key, fresh);
    return fresh;
  }

  const updated = {
    count: existing.count + 1,
    resetAt: existing.resetAt,
  } as const;
  buckets.set(key, updated);
  return updated;
};

export const withRateLimit = (
  request: Request,
  config: RateLimitConfig
): RateLimitResult => {
  const safeLimit = Math.max(1, Math.trunc(config.limit));
  const safeWindowMs = Math.max(1000, Math.trunc(config.windowMs));
  const clientAddress = getClientAddress(request);
  const key = `${config.id}:${clientAddress}`;

  const bucket = upsertBucket(key, safeLimit, safeWindowMs);
  const remaining = Math.max(0, safeLimit - bucket.count);
  const resetSeconds = Math.max(
    1,
    Math.ceil((bucket.resetAt - Date.now()) / 1000)
  );
  const headers = toHeaders(safeLimit, remaining, resetSeconds);

  if (bucket.count > safeLimit) {
    return {
      ok: false,
      response: apiError({
        status: 429,
        code: "RATE_LIMITED",
        message: "Too many requests.",
        request,
        headers: {
          ...headers,
          "Retry-After": String(resetSeconds),
        },
      }),
    };
  }

  return { ok: true, headers };
};
