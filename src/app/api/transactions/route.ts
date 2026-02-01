import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { createTransaction } from "@/features/transactions/server/create-transaction";
import { createTransactionRequestSchema } from "@/features/transactions/server/schema";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  // Route handler: validate input, call the feature service, return JSON.
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const supabaseAdmin = createAdminClient();

  const { data: authData, error: authError } = await supabase.auth.getUser();
  const user = authData?.user ?? null;

  if (authError || !user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON payload." }, { status: 400 });
  }

  const parsed = createTransactionRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Invalid input.", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  try {
    const result = await createTransaction(
      supabase,
      supabaseAdmin,
      user.id,
      parsed.data
    );
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ message }, { status: 400 });
  }
}
