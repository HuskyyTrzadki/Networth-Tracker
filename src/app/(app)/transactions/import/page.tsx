import type { Metadata } from "next";
import { Suspense } from "react";

import { ImportCsvDialogStandaloneRoute } from "@/features/transactions";
export const metadata: Metadata = {
  title: "Importuj CSV",
};

export default function TransactionsImportPage() {
  return (
    <Suspense fallback={null}>
      <ImportCsvDialogStandaloneRoute />
    </Suspense>
  );
}
