import {
  ArrowLeftRight,
  ChartCandlestick,
  House,
  Plus,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type AppNavId =
  | "overview"
  | "stocks"
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
    id: "overview",
    href: "/portfolio",
    icon: House,
    label: "Przegląd",
  },
  {
    id: "stocks",
    href: "/stocks",
    icon: ChartCandlestick,
    label: "Akcje",
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
