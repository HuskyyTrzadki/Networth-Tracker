"use client";

import { useRouter } from "next/navigation";

import { AddTransactionDialog } from "./AddTransactionDialog";

export function AddTransactionDialogRoute({
  portfolios,
  initialPortfolioId,
  forcedPortfolioId,
}: Readonly<{
  portfolios: readonly { id: string; name: string }[];
  initialPortfolioId: string;
  forcedPortfolioId: string | null;
}>) {
  const router = useRouter();

  return (
    <AddTransactionDialog
      open
      portfolios={portfolios}
      initialPortfolioId={initialPortfolioId}
      forcedPortfolioId={forcedPortfolioId}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) router.back();
      }}
    />
  );
}
