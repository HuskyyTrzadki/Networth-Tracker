import { AddTransactionDialogSkeleton } from "@/features/transactions";

export default function AddTransactionLoading() {
  return (
    <main className="mx-auto w-full max-w-[1560px] px-6 py-8">
      <AddTransactionDialogSkeleton />
    </main>
  );
}
