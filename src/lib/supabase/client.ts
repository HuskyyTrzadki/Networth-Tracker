import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "./database.types";
import { getSupabaseEnv } from "./env";

export const createClient = () => {
  const { supabaseUrl, supabaseKey } = getSupabaseEnv();

  return createBrowserClient<Database>(supabaseUrl, supabaseKey);
};
