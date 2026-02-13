import { redirect } from "next/navigation";
import { PortfolioPageView } from "./PortfolioPageView";

type Props = Readonly<{
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>;

const getFirstParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export const metadata = {
  title: "Portfele",
};

export default async function PortfolioPage({ searchParams }: Props) {
  const params = await searchParams;
  const requestedPortfolio = getFirstParam(params.portfolio)?.trim() ?? null;

  if (requestedPortfolio === "all") {
    const nextParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (key === "portfolio") return;
      const first = getFirstParam(value);
      if (first && first.trim().length > 0) {
        nextParams.set(key, first);
      }
    });

    const nextQuery = nextParams.toString();
    redirect(nextQuery.length > 0 ? `/portfolio?${nextQuery}` : "/portfolio");
  }

  if (requestedPortfolio && requestedPortfolio !== "all") {
    const nextParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (key === "portfolio") return;
      const first = getFirstParam(value);
      if (first && first.trim().length > 0) {
        nextParams.set(key, first);
      }
    });
    const nextQuery = nextParams.toString();
    redirect(
      nextQuery.length > 0
        ? `/portfolio/${requestedPortfolio}?${nextQuery}`
        : `/portfolio/${requestedPortfolio}`
    );
  }

  return <PortfolioPageView selectedPortfolioId={null} />;
}
