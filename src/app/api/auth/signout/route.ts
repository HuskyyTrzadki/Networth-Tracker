import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { signOut } from "@/features/auth/server/service";

export async function POST() {
  // Clears the session cookie on the server.
  try {
    await signOut(await cookies());
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ message }, { status: 400 });
  }
}
