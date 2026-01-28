import { cookies } from "next/headers";

import { AddTransactionDialogRoute } from "@/features/transactions";
import { resolvePortfolioId } from "@/features/transactions/server/resolve-portfolio-id";
import { createClient } from "@/lib/supabase/server";

type Props = Readonly<{
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>;

export default async function AddTransactionModalPage({
  searchParams,
}: Props) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    return null;
  }

  const portfolioId = await resolvePortfolioId({
    searchParams: params,
    supabase,
    userId: data.user.id,
  });

  return <AddTransactionDialogRoute portfolioId={portfolioId} />;
}
