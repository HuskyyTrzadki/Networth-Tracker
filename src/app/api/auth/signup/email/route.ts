import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { parseEmailPasswordPayload } from "@/features/auth/server/credentials";
import { getRequestOrigin } from "@/features/auth/server/request-origin";
import { signUpWithEmailPassword } from "@/features/auth/server/service";
import { apiError } from "@/lib/http/api-error";

const buildEmailRedirectTo = (request: Request) => {
  // Redirect email confirmations back into the app auth callback flow.
  const url = new URL("/api/auth/callback", getRequestOrigin(request));
  // New accounts should continue from onboarding after confirmation.
  url.searchParams.set("next", "/onboarding");
  return url.toString();
};

export async function POST(request: Request) {
  // Signs up with email/password and starts the confirmation flow if required.
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError({
      status: 400,
      code: "INVALID_JSON",
      message: "Invalid JSON body.",
      request,
    });
  }

  const parsed = parseEmailPasswordPayload(body);
  if (!parsed.ok) {
    return apiError({
      status: 400,
      code: "VALIDATION_ERROR",
      message: "Invalid email or password.",
      request,
    });
  }

  const emailRedirectTo = buildEmailRedirectTo(request);

  try {
    const result = await signUpWithEmailPassword(await cookies(), {
      ...parsed.data,
      emailRedirectTo,
    });
    return NextResponse.json(
      {
        ...result,
        nextStep: "email_confirmation_may_be_required",
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return apiError({
      status: 400,
      code: "AUTH_SIGNUP_FAILED",
      message,
      request,
    });
  }
}
