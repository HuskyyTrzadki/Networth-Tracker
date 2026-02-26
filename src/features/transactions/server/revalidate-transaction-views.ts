import { revalidatePath, revalidateTag } from "next/cache";

type Options = Readonly<{
  includeStocks?: boolean;
}>;

export const revalidateTransactionViews = (
  portfolioId: string,
  { includeStocks = false }: Options = {}
) => {
  revalidatePath("/portfolio");
  revalidatePath(`/portfolio/${portfolioId}`);
  revalidatePath("/transactions");
  if (includeStocks) {
    revalidatePath("/stocks");
  }
  revalidateTag("portfolio:all", "max");
  revalidateTag(`portfolio:${portfolioId}`, "max");
  revalidateTag("transactions:all", "max");
  revalidateTag(`transactions:portfolio:${portfolioId}`, "max");
};
