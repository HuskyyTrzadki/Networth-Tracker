import { connection } from "next/server";
import { cookies } from "next/headers";
import { Suspense } from "react";

import { getGuestUpgradeNudgeState } from "@/features/auth/server/guest-upgrade-nudges";
import { AppShell } from "@/features/app-shell/components/AppShell";
import { DemoAccountCallout } from "@/features/app-shell/components/DemoAccountCallout";
import { DemoAccountPageFooter } from "@/features/app-shell/components/DemoAccountPageFooter";
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
  const [portfolios, guestUpgradeState] = await Promise.all([
    getSidebarPortfoliosCached(),
    getGuestUpgradeNudgeState(await cookies()),
  ]);

  return (
    <AppShell
      demoSidebarCallout={
        guestUpgradeState.settingsBadge === "demo" ? <DemoAccountCallout /> : null
      }
      portfolios={portfolios}
      guestUpgradeBanner={guestUpgradeState.banner}
      settingsBadge={guestUpgradeState.settingsBadge}
    >
      <>
        {children}
        {guestUpgradeState.settingsBadge === "demo" ? (
          <DemoAccountPageFooter>
            <div className="px-6 pb-10 pt-6">
              <DemoAccountCallout className="max-w-sm" />
            </div>
          </DemoAccountPageFooter>
        ) : null}
      </>
    </AppShell>
  );
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
      isDemo: boolean;
    }[];
  }
};
