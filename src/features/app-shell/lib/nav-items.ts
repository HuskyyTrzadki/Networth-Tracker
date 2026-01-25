import {
  ArrowLeftRight,
  LayoutGrid,
  Plus,
  Search,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type AppNavId =
  | "portfolio"
  | "search"
  | "transactions"
  | "add"
  | "settings";

export type AppNavItem = Readonly<{
  id: AppNavId;
  href: string;
  icon: LucideIcon;
  label: string;
}>;

export const primaryNavItems: readonly AppNavItem[] = [
  {
    id: "portfolio",
    href: "/portfolio",
    icon: LayoutGrid,
    label: "Portfel",
  },
  {
    id: "search",
    href: "/search",
    icon: Search,
    label: "Szukaj",
  },
  {
    id: "transactions",
    href: "/transactions",
    icon: ArrowLeftRight,
    label: "Transakcje",
  },
] as const;

export const secondaryNavItems: readonly AppNavItem[] = [
  {
    id: "settings",
    href: "/settings",
    icon: Settings,
    label: "Ustawienia",
  },
] as const;

export const mobileActionNavItem: AppNavItem = {
  id: "add",
  href: "/transactions/new",
  icon: Plus,
  label: "Dodaj",
} as const;
