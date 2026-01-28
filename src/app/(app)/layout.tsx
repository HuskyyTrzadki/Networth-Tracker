import { cookies } from "next/headers";

import { AppShell } from "@/features/app-shell";
import { listPortfolios } from "@/features/portfolio/server/list-portfolios";
import { createClient } from "@/lib/supabase/server";

type Props = Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>;

export default async function AppLayout({ children, modal }: Props) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // Server-side: resolve the user from cookies so RLS filters portfolios correctly.
  const { data } = await supabase.auth.getUser();

  let portfolios: readonly {
    id: string;
    name: string;
    baseCurrency: string;
  }[] = [];

  if (data.user) {
    try {
      // Server-side: preload portfolios for the desktop sidebar to avoid client fetches.
      portfolios = await listPortfolios(supabase, data.user.id);
    } catch (error) {
      // Server-side: keep the shell rendering even if data fetch fails.
      console.error("Failed to load portfolios for sidebar", error);
    }
  }

  return (
    <>
      <AppShell portfolios={portfolios}>{children}</AppShell>
      {modal}
    </>
  );
}
