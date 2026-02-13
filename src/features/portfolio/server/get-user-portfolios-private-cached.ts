import { cacheLife, cacheTag } from "next/cache";
import { cookies } from "next/headers";

import { createClient } from "@/lib/supabase/server";

import { listPortfolios } from "./list-portfolios";

type UserPortfolio = Readonly<{
  id: string;
  name: string;
  baseCurrency: string;
}>;

type UserPortfoliosResult = Readonly<{
  isAuthenticated: boolean;
  portfolios: readonly UserPortfolio[];
}>;

export const getUserPortfoliosPrivateCached =
  async (): Promise<UserPortfoliosResult> => {
    "use cache: private";

    // Private user data: keep a short cache and invalidate via portfolio:* tags.
    cacheLife("minutes");
    cacheTag("portfolio:all");

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data } = await supabase.auth.getUser();

    if (!data.user) {
      return {
        isAuthenticated: false,
        portfolios: [],
      };
    }

    return {
      isAuthenticated: true,
      portfolios: await listPortfolios(supabase),
    };
  };
