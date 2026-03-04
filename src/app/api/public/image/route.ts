import { isIP } from "node:net";

import { buildLogoDevTickerRemoteUrls } from "@/features/common/lib/logo-dev";
import { apiError } from "@/lib/http/api-error";
import { withRateLimit } from "@/lib/http/rate-limit";

const ONE_DAY_SECONDS = 60 * 60 * 24;
const LOGO_CACHE_FRESH_SECONDS = ONE_DAY_SECONDS * 7;
const LOGO_CACHE_STALE_SECONDS = ONE_DAY_SECONDS * 30;

type CandidateImageUrl = Readonly<{
  url: URL;
  freshSeconds: number;
  staleSeconds: number;
}>;

const isBlockedHostname = (hostname: string) => {
  const normalized = hostname.trim().toLowerCase();

  if (!normalized) {
    return true;
  }

  if (
    normalized === "localhost" ||
    normalized.endsWith(".localhost") ||
    normalized.endsWith(".local")
  ) {
    return true;
  }

  return isIP(normalized) !== 0;
};

const parseRemoteImageUrl = (value: string | null) => {
  if (!value) {
    return null;
  }

  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "https:") {
      return null;
    }

    if (isBlockedHostname(parsed.hostname)) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
};

export async function GET(request: Request) {
  const rateLimit = withRateLimit(request, {
    id: "api:public-image",
    limit: 60,
    windowMs: 60_000,
  });
  if (!rateLimit.ok) {
    return rateLimit.response;
  }

  const requestUrl = new URL(request.url);
  const explicitRemoteUrl = parseRemoteImageUrl(requestUrl.searchParams.get("url"));
  const logoDevToken =
    process.env.LOGO_DEV_PUBLISHABLE_KEY?.trim() ??
    process.env.LOGO_DEV_SECRET_KEY?.trim();
  const logoDevTickerUrls = buildLogoDevTickerRemoteUrls(
    requestUrl.searchParams.get("ticker"),
    logoDevToken
  )
    .map((url) => parseRemoteImageUrl(url))
    .filter((url): url is URL => Boolean(url));

  const candidates: CandidateImageUrl[] = [];
  if (explicitRemoteUrl) {
    candidates.push({
      url: explicitRemoteUrl,
      freshSeconds: LOGO_CACHE_FRESH_SECONDS,
      staleSeconds: LOGO_CACHE_STALE_SECONDS,
    });
  } else if (logoDevTickerUrls.length > 0) {
    candidates.push(
      ...logoDevTickerUrls.map((url) => ({
        url,
        freshSeconds: LOGO_CACHE_FRESH_SECONDS,
        staleSeconds: LOGO_CACHE_STALE_SECONDS,
      }))
    );
  }

  if (candidates.length === 0) {
    return apiError({
      status: 400,
      code: "INVALID_IMAGE_URL",
      message: "Invalid image URL.",
      request,
      headers: rateLimit.headers,
    });
  }

  for (const candidate of candidates) {
    let upstreamResponse: Response;
    try {
      upstreamResponse = await fetch(candidate.url.toString(), {
        headers: {
          Accept: "image/*",
        },
        next: {
          revalidate: candidate.freshSeconds,
        },
      });
    } catch {
      continue;
    }

    if (!upstreamResponse.ok || !upstreamResponse.body) {
      continue;
    }

    const contentType = upstreamResponse.headers.get("content-type")?.toLowerCase() ?? "";
    if (!contentType.startsWith("image/") || contentType.includes("svg")) {
      continue;
    }

    return new Response(upstreamResponse.body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": `public, max-age=0, s-maxage=${candidate.freshSeconds}, stale-while-revalidate=${candidate.staleSeconds}`,
        ...rateLimit.headers,
      },
    });
  }

  return apiError({
    status: 404,
    code: "IMAGE_NOT_FOUND",
    message: "Image not found.",
    request,
    headers: rateLimit.headers,
  });
}
