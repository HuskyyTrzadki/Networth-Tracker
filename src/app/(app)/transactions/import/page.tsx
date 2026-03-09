import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/features/design-system/components/ui/button";
import {
  DEFAULT_BROKER_IMPORT_PROVIDER,
  brokerImportUiConfig,
  isBrokerImportProviderId,
} from "@/features/transactions/lib/broker-import-providers";
import { ImportCsvDialogSkeleton } from "@/features/transactions/components/ImportCsvDialogSkeleton";
import { ImportCsvDialogStandaloneRoute } from "@/features/transactions/components/ImportCsvDialogStandaloneRoute";
import { getImportDialogData } from "@/features/transactions/server/get-import-dialog-data";

type Props = Readonly<{
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>;

export const metadata: Metadata = {
  title: "Importuj od brokera",
};

export default async function TransactionsImportPage({ searchParams }: Props) {
  const params = await searchParams;
  const providerParam = Array.isArray(params.provider) ? params.provider[0] : params.provider;
  const provider = isBrokerImportProviderId(providerParam)
    ? providerParam
    : DEFAULT_BROKER_IMPORT_PROVIDER;
  const ui = brokerImportUiConfig[provider];
  const dialogData = await getImportDialogData(params);

  if (dialogData.status === "unauthenticated") {
    return (
      <main className="mx-auto w-full max-w-[1560px] px-6 py-8">
        <section className="max-w-[720px] rounded-xl border border-border/75 bg-card/94 p-6 shadow-[var(--surface-shadow)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/80">
            Dostęp wymagany
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">{ui.unauthenticatedTitle}</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {ui.unauthenticatedDescription}
          </p>
          <Button asChild className="mt-5 h-11">
            <Link href={{ pathname: "/login", query: { next: "/transactions/import" } }}>
              {ui.unauthenticatedButtonLabel}
            </Link>
          </Button>
        </section>
      </main>
    );
  }

  if (dialogData.status === "empty") {
    redirect("/onboarding");
  }

  return (
    <Suspense fallback={<ImportCsvDialogSkeleton />}>
      <ImportCsvDialogStandaloneRoute
        provider={provider}
        portfolios={dialogData.portfolios}
        initialPortfolioId={dialogData.initialPortfolioId}
        forcedPortfolioId={dialogData.forcedPortfolioId}
      />
    </Suspense>
  );
}
