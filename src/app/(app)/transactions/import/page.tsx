import { ImportCsvDialogStandaloneRoute } from "@/features/transactions";
export const metadata = {
  title: "Importuj CSV",
};

export default async function TransactionsImportPage() {
  return <ImportCsvDialogStandaloneRoute />;
}
