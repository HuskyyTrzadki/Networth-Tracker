export const instrumentTypes = [
  "EQUITY",
  "ETF",
  "CRYPTOCURRENCY",
  "MUTUALFUND",
  "CURRENCY",
  "INDEX",
  "OPTION",
  "FUTURE",
  "MONEYMARKET",
  "ECNQUOTE",
  "ALTSYMBOL",
] as const;

export type InstrumentType = (typeof instrumentTypes)[number];
