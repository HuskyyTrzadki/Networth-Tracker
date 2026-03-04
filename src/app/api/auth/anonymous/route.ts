import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { signInAnonymously } from "@/features/auth/server/service";
import { apiError } from "@/lib/http/api-error";

export async function POST(request: Request) {
  // Creates an anonymous session and returns a minimal response payload.
  try {
    const result = await signInAnonymously(await cookies());
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return apiError({
      status: 400,
      code: "AUTH_ANONYMOUS_SIGNIN_FAILED",
      message,
      request,
    });
  }
}
