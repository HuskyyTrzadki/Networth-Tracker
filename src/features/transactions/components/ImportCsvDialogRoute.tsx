"use client";

import { useRouter } from "next/navigation";

import { ImportCsvDialog } from "./ImportCsvDialog";

export function ImportCsvDialogRoute() {
  const router = useRouter();

  return (
    <ImportCsvDialog
      open
      onOpenChange={(nextOpen) => {
        if (!nextOpen) router.back();
      }}
    />
  );
}
