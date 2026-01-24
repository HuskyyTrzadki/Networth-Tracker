import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { cookies } from "next/headers";

import { getSupabaseEnv } from "./env";

type CookieStore = Awaited<ReturnType<typeof cookies>>;

type MutableCookieStore = CookieStore & {
  set: (name: string, value: string, options?: CookieOptions) => void;
};

const isMutableCookieStore = (store: CookieStore): store is MutableCookieStore =>
  "set" in store;

export const createClient = (cookieStore: CookieStore) => {
  const { supabaseUrl, supabaseKey } = getSupabaseEnv();

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          if (!isMutableCookieStore(cookieStore)) {
            return;
          }

          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // setAll can be called from Server Components where cookies are read-only.
        }
      },
    },
  });
};
