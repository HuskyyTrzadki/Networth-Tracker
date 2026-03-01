import { createAdminClient } from "@/lib/supabase/admin";

export async function isDemoAccount(
  userId: string
): Promise<boolean> {
  const supabaseAdmin = createAdminClient();
  const { count, error } = await supabaseAdmin
    .from("demo_bundle_instances")
    .select("bundle_id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  return (count ?? 0) > 0;
}
