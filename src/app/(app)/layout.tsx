import { cookies } from "next/headers";
import { connection } from "next/server";
import { Suspense } from "react";
import { cacheLife, cacheTag } from "next/cache";

import { AppShell } from "@/features/app-shell";
import { listPortfolios } from "@/features/portfolio/server/list-portfolios";
import { createClient } from "@/lib/supabase/server";

type Props = Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>;

export default async function AppLayout({ children, modal }: Props) {
  return (
    <>
      <Suspense fallback={<AppShell portfolios={[]}>{children}</AppShell>}>
        <AuthenticatedAppShell>{children}</AuthenticatedAppShell>
      </Suspense>
      {modal}
    </>
  );
}

type AuthenticatedAppShellProps = Readonly<{
  children: React.ReactNode;
}>;

async function AuthenticatedAppShell({ children }: AuthenticatedAppShellProps) {
  await connection();
  const portfolios = await getSidebarPortfoliosCached();

  return <AppShell portfolios={portfolios}>{children}</AppShell>;
}

const getSidebarPortfoliosCached = async () => {
  "use cache: private";

  // Sidebar list changes only on portfolio writes; keep warm between navigations.
  cacheLife("minutes");
  cacheTag("portfolio:all");

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    return [] as readonly {
      id: string;
      name: string;
      baseCurrency: string;
    }[];
  }

  try {
    return await listPortfolios(supabase);
  } catch (error) {
    // Server-side: keep the shell rendering even if data fetch fails.
    console.error("Failed to load portfolios for sidebar", error);
    return [] as readonly {
      id: string;
      name: string;
      baseCurrency: string;
    }[];
  }
};
