"use client";

import { useRouter } from "next/navigation";

import { AddTransactionDialog } from "./AddTransactionDialog";

export function AddTransactionDialogRoute({
  portfolioId,
}: Readonly<{ portfolioId: string }>) {
  const router = useRouter();

  return (
    <AddTransactionDialog
      open
      portfolioId={portfolioId}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) router.back();
      }}
    />
  );
}
