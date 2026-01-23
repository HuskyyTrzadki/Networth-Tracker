const LOCALE_PREFIX_REGEX = /^\/(pl|en)(?=\/|$)/;

function stripTrailingSlashes(value: string) {
  return value.replace(/\/+$/, "");
}

export function normalizeAppPath(value: string) {
  const withLeadingSlash = value.startsWith("/") ? value : `/${value}`;
  const withoutTrailingSlashes = stripTrailingSlashes(withLeadingSlash);
  return withoutTrailingSlashes === "" ? "/" : withoutTrailingSlashes;
}

export function stripLocalePrefix(value: string) {
  const normalized = normalizeAppPath(value);
  const withoutLocalePrefix = normalized.replace(LOCALE_PREFIX_REGEX, "");
  return withoutLocalePrefix === "" ? "/" : withoutLocalePrefix;
}

export function isHrefActive(currentPathname: string, href: string) {
  const current = normalizeAppPath(currentPathname);
  const target = normalizeAppPath(href);

  if (target === "/") return current === "/";
  return current === target || current.startsWith(`${target}/`);
}

