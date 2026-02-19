export const customAssetTypes = [
  "REAL_ESTATE",
  "CAR",
  "COMPUTER",
  "TREASURY_BONDS",
  "TERM_DEPOSIT",
  "PRIVATE_LOAN",
  "OTHER",
] as const;

export type CustomAssetType = (typeof customAssetTypes)[number];

export const DEFAULT_CUSTOM_ASSET_TYPE: CustomAssetType = "REAL_ESTATE";

export const customAssetTypeLabels: Readonly<Record<CustomAssetType, string>> = {
  REAL_ESTATE: "Nieruchomość",
  CAR: "Samochód",
  COMPUTER: "Komputer",
  TREASURY_BONDS: "Obligacje skarbowe",
  TERM_DEPOSIT: "Lokata",
  PRIVATE_LOAN: "Pożyczka prywatna",
  OTHER: "Inne",
};

export const isCustomAssetType = (value: string): value is CustomAssetType =>
  customAssetTypes.includes(value as CustomAssetType);
