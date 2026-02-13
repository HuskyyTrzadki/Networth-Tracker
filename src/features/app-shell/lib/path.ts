function stripTrailingSlashes(value: string) {
  return value.replace(/\/+$/, "");
}

export function normalizeAppPath(value: string) {
  const withLeadingSlash = value.startsWith("/") ? value : `/${value}`;
  const withoutTrailingSlashes = stripTrailingSlashes(withLeadingSlash);
  return withoutTrailingSlashes === "" ? "/" : withoutTrailingSlashes;
}

export function isHrefActive(currentPathname: string, href: string) {
  const current = normalizeAppPath(currentPathname);
  const target = normalizeAppPath(href);

  if (target === "/") return current === "/";
  return current === target || current.startsWith(`${target}/`);
}

export function getPortfolioIdFromPathname(pathname: string): string | null {
  const normalizedPath = normalizeAppPath(pathname);

  if (!normalizedPath.startsWith("/portfolio")) {
    return null;
  }

  const segments = normalizedPath.split("/").filter((segment) => segment.length > 0);
  if (segments.length !== 2 || segments[0] !== "portfolio") {
    return null;
  }

  return segments[1] ?? null;
}
