import { Suspense } from "react";

import { ImportCsvDialogRoute } from "@/features/transactions";

export default async function ImportCsvModalPage() {
  return (
    <Suspense fallback={null}>
      <ImportCsvDialogRoute />
    </Suspense>
  );
}
