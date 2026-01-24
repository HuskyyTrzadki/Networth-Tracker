import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getSafeNextPath } from "@/features/auth/server/next-path";
import { exchangeOAuthCodeForSession } from "@/features/auth/server/service";

export async function GET(request: Request) {
  // Handles OAuth redirect by exchanging the `code` for a session cookie.
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next");
  const safeNext = getSafeNextPath(next);

  if (!code) {
    // No code means we can't complete the auth flow; just redirect.
    return NextResponse.redirect(new URL(safeNext, url.origin));
  }

  try {
    await exchangeOAuthCodeForSession(await cookies(), code);
    return NextResponse.redirect(new URL(safeNext, url.origin));
  } catch {
    // Surface a simple flag so UI can show a localized error message.
    const errorUrl = new URL(safeNext, url.origin);
    errorUrl.searchParams.set("auth", "error");
    return NextResponse.redirect(errorUrl);
  }
}
