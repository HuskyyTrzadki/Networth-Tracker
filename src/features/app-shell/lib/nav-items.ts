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
  labelKey: string;
}>;

export const primaryNavItems: readonly AppNavItem[] = [
  {
    id: "portfolio",
    href: "/",
    icon: LayoutGrid,
    labelKey: "Navigation.items.portfolio",
  },
  {
    id: "search",
    href: "/search",
    icon: Search,
    labelKey: "Navigation.items.search",
  },
  {
    id: "transactions",
    href: "/transactions",
    icon: ArrowLeftRight,
    labelKey: "Navigation.items.transactions",
  },
] as const;

export const secondaryNavItems: readonly AppNavItem[] = [
  {
    id: "settings",
    href: "/settings",
    icon: Settings,
    labelKey: "Navigation.items.settings",
  },
] as const;

export const mobileActionNavItem: AppNavItem = {
  id: "add",
  href: "/transactions/new",
  icon: Plus,
  labelKey: "Navigation.items.add",
} as const;
