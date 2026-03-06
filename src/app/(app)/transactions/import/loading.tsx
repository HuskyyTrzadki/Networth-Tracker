import { ImportCsvDialogSkeleton } from "@/features/transactions/components/ImportCsvDialogSkeleton";

export default function TransactionsImportLoading() {
  return (
    <main className="mx-auto w-full max-w-[1560px] px-6 py-8">
      <ImportCsvDialogSkeleton />
    </main>
  );
}
