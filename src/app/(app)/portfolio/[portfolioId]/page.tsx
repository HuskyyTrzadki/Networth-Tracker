import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PortfolioPageView } from "../PortfolioPageView";

type Props = Readonly<{
  params: Promise<{
    portfolioId: string;
  }>;
}>;

export const metadata: Metadata = {
  title: "Portfele",
};

export default async function PortfolioByIdPage({ params }: Props) {
  const { portfolioId } = await params;

  if (portfolioId === "all") {
    redirect("/portfolio");
  }

  return <PortfolioPageView selectedPortfolioId={portfolioId} />;
}
