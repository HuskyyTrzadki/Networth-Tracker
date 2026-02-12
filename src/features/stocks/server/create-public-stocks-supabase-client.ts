import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { tryCreateAdminClient } from "@/lib/supabase/admin";
import { getSupabaseEnv } from "@/lib/supabase/env";

export function createPublicStocksSupabaseClient() {
  const adminClient = tryCreateAdminClient();
  if (adminClient) {
    return adminClient;
  }

  // Public market-data reads do not require user session cookies.
  const { supabaseUrl, supabaseKey } = getSupabaseEnv();
  return createSupabaseClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  });
}
