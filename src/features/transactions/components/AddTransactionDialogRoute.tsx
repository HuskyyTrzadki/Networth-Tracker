"use client";

import { useRouter } from "next/navigation";

import { AddTransactionDialog } from "./AddTransactionDialog";

export function AddTransactionDialogRoute() {
  const router = useRouter();

  return (
    <AddTransactionDialog
      open
      onOpenChange={(nextOpen) => {
        if (!nextOpen) router.back();
      }}
    />
  );
}
