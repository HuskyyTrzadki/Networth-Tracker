import { isIP } from "node:net";

import { NextResponse } from "next/server";

const ONE_DAY_SECONDS = 60 * 60 * 24;
const ONE_WEEK_SECONDS = ONE_DAY_SECONDS * 7;

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
  const requestUrl = new URL(request.url);
  const remoteUrl = parseRemoteImageUrl(requestUrl.searchParams.get("url"));
  if (!remoteUrl) {
    return NextResponse.json({ message: "Invalid image URL." }, { status: 400 });
  }

  let upstreamResponse: Response;
  try {
    upstreamResponse = await fetch(remoteUrl.toString(), {
      headers: {
        Accept: "image/*",
      },
      next: {
        revalidate: ONE_DAY_SECONDS,
      },
    });
  } catch {
    return NextResponse.json({ message: "Failed to fetch image." }, { status: 502 });
  }

  if (!upstreamResponse.ok || !upstreamResponse.body) {
    return NextResponse.json({ message: "Image not found." }, { status: 404 });
  }

  const contentType = upstreamResponse.headers.get("content-type")?.toLowerCase() ?? "";
  if (!contentType.startsWith("image/") || contentType.includes("svg")) {
    return NextResponse.json({ message: "Unsupported image type." }, { status: 415 });
  }

  return new Response(upstreamResponse.body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": `public, max-age=0, s-maxage=${ONE_DAY_SECONDS}, stale-while-revalidate=${ONE_WEEK_SECONDS}`,
    },
  });
}
