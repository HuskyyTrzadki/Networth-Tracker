import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { HomeHero } from "@/features/home";
import { getUserPortfoliosPrivateCached } from "@/features/portfolio/server/get-user-portfolios-private-cached";

export const metadata: Metadata = {
  title: "Portfolio Tracker",
};

export default async function Home() {
  const pageData = await getUserPortfoliosPrivateCached();
  if (pageData.isAuthenticated) {
    redirect(pageData.portfolios.length > 0 ? "/portfolio" : "/onboarding");
  }

  return <HomeHero />;
}
