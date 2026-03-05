import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getSafeNextPath } from "@/features/auth/server/next-path";
import { getRequestOrigin } from "@/features/auth/server/request-origin";
import { startGoogleSignIn } from "@/features/auth/server/service";
import { apiError } from "@/lib/http/api-error";

const FALLBACK_NEXT_PATH = "/portfolio";

const buildOAuthCallbackRedirect = (request: Request, safeNextPath: string) => {
  const callbackUrl = new URL("/api/auth/callback", getRequestOrigin(request));
  callbackUrl.searchParams.set("next", safeNextPath);
  return callbackUrl.toString();
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const nextPath = url.searchParams.get("next");
  const safeNextPath = getSafeNextPath(nextPath, FALLBACK_NEXT_PATH);
  const redirectTo = buildOAuthCallbackRedirect(request, safeNextPath);

  try {
    const result = await startGoogleSignIn(await cookies(), redirectTo);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return apiError({
      status: 400,
      code: "AUTH_GOOGLE_SIGNIN_START_FAILED",
      message,
      request,
    });
  }
}
