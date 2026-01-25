"use client";

import { usePathname } from "next/navigation";

import { normalizeAppPath } from "../lib/path";

export function useAppPathname() {
  const pathname = usePathname() ?? "/";
  return normalizeAppPath(pathname);
}
