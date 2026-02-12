import { Suspense } from "react";

import { ImportCsvDialogStandaloneRoute } from "@/features/transactions";
export const metadata = {
  title: "Importuj CSV",
};

export default async function TransactionsImportPage() {
  return (
    <Suspense fallback={null}>
      <ImportCsvDialogStandaloneRoute />
    </Suspense>
  );
}
