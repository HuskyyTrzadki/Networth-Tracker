import { Suspense } from "react";

import { ImportCsvDialogRoute } from "@/features/transactions/components/ImportCsvDialogRoute";

export default function ImportCsvModalPage() {
  return (
    <Suspense fallback={null}>
      <ImportCsvDialogRoute />
    </Suspense>
  );
}
