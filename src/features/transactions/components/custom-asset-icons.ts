import {
  Building2,
  Car,
  CircleHelp,
  HandCoins,
  Landmark,
  Laptop,
  type LucideIcon,
  PiggyBank,
} from "lucide-react";

import type { CustomAssetType } from "../lib/custom-asset-types";

export const customAssetTypeIcons: Readonly<Record<CustomAssetType, LucideIcon>> = {
  REAL_ESTATE: Building2,
  CAR: Car,
  COMPUTER: Laptop,
  TREASURY_BONDS: Landmark,
  TERM_DEPOSIT: PiggyBank,
  PRIVATE_LOAN: HandCoins,
  OTHER: CircleHelp,
};
