import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { newsreader } from "@/app/fonts";
import { HomeHero } from "@/features/home/components/HomeHero";
import { getUserPortfoliosPrivateCached } from "@/features/portfolio/server/get-user-portfolios-private-cached";

export const metadata: Metadata = {
  title: "Portfolio Tracker",
};

export default async function Home() {
  const pageData = await getUserPortfoliosPrivateCached();
  if (pageData.isAuthenticated) {
    redirect(pageData.portfolios.length > 0 ? "/portfolio" : "/onboarding");
  }

  return <div className={newsreader.variable}><HomeHero /></div>;
}
