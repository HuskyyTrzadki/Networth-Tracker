export type BuildPortfolioUrlArgs = Readonly<{
  pathname: string;
  searchParamsString: string;
  nextPortfolioId: string | null;
  resetPageParam: boolean;
}>;

export function buildPortfolioUrl({
  pathname,
  searchParamsString,
  nextPortfolioId,
  resetPageParam,
}: BuildPortfolioUrlArgs): string {
  if (pathname === "/portfolio" || pathname.startsWith("/portfolio/")) {
    const params = new URLSearchParams(searchParamsString);
    params.delete("portfolio");

    if (resetPageParam) {
      params.set("page", "1");
    } else {
      params.delete("page");
    }

    const nextPathname = nextPortfolioId ? `/portfolio/${nextPortfolioId}` : "/portfolio";
    const queryString = params.toString();
    return queryString.length > 0 ? `${nextPathname}?${queryString}` : nextPathname;
  }

  const params = new URLSearchParams(searchParamsString);

  if (nextPortfolioId) {
    params.set("portfolio", nextPortfolioId);
  } else {
    params.delete("portfolio");
  }

  if (resetPageParam) {
    params.set("page", "1");
  } else {
    params.delete("page");
  }

  const queryString = params.toString();
  return queryString.length > 0 ? `${pathname}?${queryString}` : pathname;
}
