import type { Metadata } from "next";
import { Suspense } from "react";

import { ImportCsvDialogSkeleton } from "@/features/transactions/components/ImportCsvDialogSkeleton";
import { ImportCsvDialogStandaloneRoute } from "@/features/transactions/components/ImportCsvDialogStandaloneRoute";

export const metadata: Metadata = {
  title: "Importuj CSV",
};

export default function TransactionsImportPage() {
  return (
    <Suspense fallback={<ImportCsvDialogSkeleton />}>
      <ImportCsvDialogStandaloneRoute />
    </Suspense>
  );
}
