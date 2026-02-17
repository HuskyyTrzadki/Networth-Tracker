import { Suspense } from "react";

import { ImportCsvDialogRoute } from "@/features/transactions";

export default function ImportCsvModalPage() {
  return (
    <Suspense fallback={null}>
      <ImportCsvDialogRoute />
    </Suspense>
  );
}
