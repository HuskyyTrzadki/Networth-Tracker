import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { parseEmailPasswordPayload } from "@/features/auth/server/credentials";
import { getRequestOrigin } from "@/features/auth/server/request-origin";
import { signUpWithEmailPassword } from "@/features/auth/server/service";

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
    return NextResponse.json(
      { message: "Invalid JSON body." },
      { status: 400 }
    );
  }

  const parsed = parseEmailPasswordPayload(body);
  if (!parsed.ok) {
    return NextResponse.json(
      { message: "Invalid email or password." },
      { status: 400 }
    );
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
    return NextResponse.json({ message }, { status: 400 });
  }
}
