"use client";

import { useRouter } from "next/navigation";

import { AddTransactionDialog } from "./AddTransactionDialog";

export function AddTransactionDialogStandaloneRoute() {
  const router = useRouter();

  return (
    <AddTransactionDialog
      open
      onOpenChange={(nextOpen) => {
        if (!nextOpen) router.replace("/transactions");
      }}
    />
  );
}
