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
