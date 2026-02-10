const takeFirstHeaderValue = (value: string | null): string | null => {
  if (!value) return null;
  const [first] = value.split(",");
  const trimmed = first?.trim();
  return trimmed ? trimmed : null;
};

export function getRequestOrigin(request: Request): string {
  // Prefer forwarded headers so redirects keep the public origin behind proxies/CDNs.
  const forwardedHost = takeFirstHeaderValue(request.headers.get("x-forwarded-host"));
  const forwardedProto = takeFirstHeaderValue(request.headers.get("x-forwarded-proto"));

  if (forwardedHost && forwardedProto) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  const parsed = new URL(request.url);
  return parsed.origin;
}
