import { AddTransactionDialogSkeleton } from "@/features/transactions";

export default function AddTransactionLoading() {
  return (
    <main className="px-6 py-8">
      <AddTransactionDialogSkeleton />
    </main>
  );
}
