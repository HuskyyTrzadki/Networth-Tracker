import { AddTransactionDialogSkeleton } from "@/features/transactions/components/AddTransactionDialogSkeleton";

export default function AddTransactionLoading() {
  return (
    <main className="mx-auto w-full max-w-[1560px] px-6 py-8">
      <AddTransactionDialogSkeleton />
    </main>
  );
}
