import { redirect } from "next/navigation";
import { connection } from "next/server";

import { HomeHero } from "@/features/home";
import { getUserPortfoliosPrivateCached } from "@/features/portfolio/server/get-user-portfolios-private-cached";

export const metadata = {
  title: "Portfolio Tracker",
};

export default async function Home() {
  await connection();

  const pageData = await getUserPortfoliosPrivateCached();
  if (pageData.isAuthenticated) {
    redirect(pageData.portfolios.length > 0 ? "/portfolio" : "/onboarding");
  }

  return <HomeHero />;
}
