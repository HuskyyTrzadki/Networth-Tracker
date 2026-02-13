import { connection } from "next/server";
import { Suspense } from "react";

import { AppShell } from "@/features/app-shell";
import { getUserPortfoliosPrivateCached } from "@/features/portfolio/server/get-user-portfolios-private-cached";

type Props = Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>;

export default async function AppLayout({ children, modal }: Props) {
  return (
    <>
      <Suspense fallback={<AppShellFallback />}>
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

function AppShellFallback() {
  return (
    <AppShell portfolios={[]}>
      <main className="min-h-[calc(100vh-120px)] px-6 py-8">
        <div className="h-6 w-44 animate-pulse rounded-md bg-muted/50" />
        <div className="mt-3 h-4 w-64 animate-pulse rounded-md bg-muted/40" />
      </main>
    </AppShell>
  );
}

const getSidebarPortfoliosCached = async () => {
  try {
    return (await getUserPortfoliosPrivateCached()).portfolios;
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
