import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";

import { apiError, apiUnauthorized } from "@/lib/http/api-error";
import { createClient } from "@/lib/supabase/server";

type AuthenticatedResult = Readonly<
  | {
      ok: true;
      supabase: ReturnType<typeof createClient>;
      user: User;
    }
  | {
      ok: false;
      response: NextResponse;
    }
>;

type AuthOptions = Readonly<{
  unauthorizedMessage?: string;
}>;

type ParsedJsonResult = Readonly<
  | {
      ok: true;
      body: unknown;
    }
  | {
      ok: false;
      response: NextResponse;
    }
>;

export async function getAuthenticatedSupabase(
  options: AuthOptions = {}
): Promise<AuthenticatedResult> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data, error } = await supabase.auth.getUser();
  const user = data.user ?? null;

  if (error || !user) {
    const message = options.unauthorizedMessage ?? "Unauthorized";
    return {
      ok: false,
      response: apiUnauthorized({ message }),
    };
  }

  return { ok: true, supabase, user };
}

export async function parseJsonBody(request: Request): Promise<ParsedJsonResult> {
  try {
    const body = (await request.json()) as unknown;
    return { ok: true, body };
  } catch {
    return {
      ok: false,
      response: apiError({
        status: 400,
        code: "INVALID_JSON",
        message: "Invalid JSON payload.",
        request,
      }),
    };
  }
}

export const toErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Unknown error";
