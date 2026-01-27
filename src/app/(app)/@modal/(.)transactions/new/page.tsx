import { cookies } from "next/headers";

import { AddTransactionDialogRoute } from "@/features/transactions";
import { getDefaultPortfolioId } from "@/features/portfolio/server/default-portfolio";
import { createClient } from "@/lib/supabase/server";
export default async function AddTransactionModalPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    return null;
  }

  const portfolioId = await getDefaultPortfolioId(supabase, data.user.id);

  return <AddTransactionDialogRoute portfolioId={portfolioId} />;
}
