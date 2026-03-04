import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { signOut } from "@/features/auth/server/service";
import { apiError } from "@/lib/http/api-error";

export async function POST(request: Request) {
  // Clears the session cookie on the server.
  try {
    await signOut(await cookies());
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return apiError({
      status: 400,
      code: "AUTH_SIGNOUT_FAILED",
      message,
      request,
    });
  }
}
