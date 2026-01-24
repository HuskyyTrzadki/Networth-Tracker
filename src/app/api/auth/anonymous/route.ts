import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { signInAnonymously } from "@/features/auth/server/service";

export async function POST() {
  // Creates an anonymous session and returns a minimal response payload.
  try {
    const result = await signInAnonymously(await cookies());
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ message }, { status: 400 });
  }
}
