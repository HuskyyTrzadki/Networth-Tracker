import { Suspense } from "react";
import { connection } from "next/server";

import { ImportCsvDialogStandaloneRoute } from "@/features/transactions";
export const metadata = {
  title: "Importuj CSV",
};

export default async function TransactionsImportPage() {
  await connection();

  return (
    <Suspense fallback={null}>
      <ImportCsvDialogStandaloneRoute />
    </Suspense>
  );
}
