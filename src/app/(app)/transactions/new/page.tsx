import { AddTransactionDialogStandaloneRoute } from "@/features/transactions";
export const metadata = {
  title: "Dodaj transakcję",
};

export default async function TransactionNewPage() {
  return <AddTransactionDialogStandaloneRoute />;
}
