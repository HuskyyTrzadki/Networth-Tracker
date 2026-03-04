import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { parseEmailPasswordPayload } from "@/features/auth/server/credentials";
import { signInWithEmailPassword } from "@/features/auth/server/service";
import { apiError } from "@/lib/http/api-error";

export async function POST(request: Request) {
  // Signs in with email/password and sets auth cookies on success.
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

  try {
    const result = await signInWithEmailPassword(await cookies(), parsed.data);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return apiError({
      status: 400,
      code: "AUTH_SIGNIN_FAILED",
      message,
      request,
    });
  }
}
