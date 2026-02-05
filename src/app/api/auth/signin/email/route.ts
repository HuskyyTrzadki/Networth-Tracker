import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { parseEmailPasswordPayload } from "@/features/auth/server/credentials";
import { signInWithEmailPassword } from "@/features/auth/server/service";

export async function POST(request: Request) {
  // Signs in with email/password and sets auth cookies on success.
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

  try {
    const result = await signInWithEmailPassword(await cookies(), parsed.data);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ message }, { status: 400 });
  }
}
