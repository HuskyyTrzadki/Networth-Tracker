import { createServerClient } from "@supabase/ssr";
import type { NextRequest, NextResponse } from "next/server";

import type { Database } from "./database.types";
import { getSupabaseEnv } from "./env";

type SupabaseRequest = {
  cookies: Pick<NextRequest["cookies"], "getAll" | "set">;
};

type SupabaseResponse = {
  cookies: Pick<NextResponse["cookies"], "set">;
};

export const createClient = (request: SupabaseRequest, response: SupabaseResponse) => {
  const { supabaseUrl, supabaseKey } = getSupabaseEnv();

  const supabase = createServerClient<Database>(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  return { supabase, response };
};
