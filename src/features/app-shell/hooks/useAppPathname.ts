"use client";

import { usePathname } from "next/navigation";

import { stripLocalePrefix } from "../lib/path";

export function useAppPathname() {
  const pathname = usePathname() ?? "/";
  return stripLocalePrefix(pathname);
}

