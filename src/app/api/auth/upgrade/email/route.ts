import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { upgradeToEmailPassword } from "@/features/auth/server/service";

type Body = Readonly<{ email: string; password: string }>;

const isBody = (value: unknown): value is Body => {
  // Small runtime check to keep the handler thin and safe.
  if (!value || typeof value !== "object") return false;
  if (!("email" in value) || !("password" in value)) return false;
  if (typeof value.email !== "string") return false;
  if (typeof value.password !== "string") return false;
  return true;
};

const looksLikeEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export async function POST(request: Request) {
  // Upgrades the current session by attaching email/password credentials.
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Invalid JSON body." },
      { status: 400 }
    );
  }

  if (!isBody(body) || !looksLikeEmail(body.email) || body.password.length < 8) {
    return NextResponse.json(
      { message: "Invalid email or password." },
      { status: 400 }
    );
  }

  try {
    const result = await upgradeToEmailPassword(await cookies(), body);
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
