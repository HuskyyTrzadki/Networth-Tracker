import { Suspense } from "react";
import { connection } from "next/server";

import { ImportCsvDialogRoute } from "@/features/transactions";

export default async function ImportCsvModalPage() {
  await connection();

  return (
    <Suspense fallback={null}>
      <ImportCsvDialogRoute />
    </Suspense>
  );
}
