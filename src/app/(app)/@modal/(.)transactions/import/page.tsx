import { Suspense } from "react";

import { ImportCsvDialogSkeleton } from "@/features/transactions/components/ImportCsvDialogSkeleton";
import { ImportCsvDialogRoute } from "@/features/transactions/components/ImportCsvDialogRoute";

export default function ImportCsvModalPage() {
  return (
    <Suspense fallback={<ImportCsvDialogSkeleton fullscreen />}>
      <ImportCsvDialogRoute />
    </Suspense>
  );
}
