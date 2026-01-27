"use client";

import { useRouter } from "next/navigation";

import { AddTransactionDialog } from "./AddTransactionDialog";

export function AddTransactionDialogStandaloneRoute({
  portfolioId,
}: Readonly<{ portfolioId: string }>) {
  const router = useRouter();

  return (
    <AddTransactionDialog
      open
      portfolioId={portfolioId}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) router.replace("/transactions");
      }}
    />
  );
}
