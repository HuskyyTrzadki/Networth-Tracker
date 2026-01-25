import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getAuthUser } from "@/features/auth/server/service";
import { HomeHero } from "@/features/home";

export const metadata = {
  title: "Portfolio Tracker",
};

export default async function Home() {
  const user = await getAuthUser(await cookies());
  if (user) {
    redirect("/search");
  }

  return <HomeHero />;
}
