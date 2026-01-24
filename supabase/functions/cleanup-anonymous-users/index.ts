import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type ProfileRow = Readonly<{
  user_id: string;
}>;

const json = (body: unknown, init: ResponseInit = {}) =>
  Response.json(body, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init.headers ?? {}) },
  });

export default Deno.serve(async (request) => {
  // This function is designed for scheduled use (Supabase cron/Edge Function).
  if (request.method !== "POST") {
    return json({ message: "Method not allowed." }, { status: 405 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    // Service Role is required to delete auth users securely.
    return json({ message: "Missing Supabase env vars." }, { status: 500 });
  }

  const client = createClient(supabaseUrl, serviceRoleKey);

  // Inactivity window: 60 days since last active.
  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await client
    .from("profiles")
    .select("user_id")
    .is("upgraded_at", null)
    .lt("last_active_at", sixtyDaysAgo);

  if (error) {
    return json({ message: error.message }, { status: 500 });
  }

  const profiles = (data ?? []) as ProfileRow[];
  const deleted: string[] = [];
  const failed: string[] = [];

  // Delete auth users; DB rows cascade via FK on profiles.user_id.
  for (const profile of profiles) {
    const result = await client.auth.admin.deleteUser(profile.user_id);
    if (result.error) {
      failed.push(profile.user_id);
      continue;
    }
    deleted.push(profile.user_id);
  }

  return json({ deleted, failed }, { status: 200 });
});
