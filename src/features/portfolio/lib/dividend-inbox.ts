export type DividendMarket = "PL" | "US" | "UNKNOWN";

export type DividendInboxItem = Readonly<{
  dividendEventKey: string;
  providerKey: string;
  symbol: string;
  name: string;
  eventDate: string;
  payoutCurrency: string;
  amountPerShare: string | null;
  estimatedShares: string | null;
  estimatedGross: string | null;
  netSuggested: string | null;
  smartDefaultHint: string | null;
  market: DividendMarket;
  isBooked: boolean;
  canBook: boolean;
  disabledReason: string | null;
}>;

export type DividendInboxResult = Readonly<{
  scope: "PORTFOLIO" | "ALL";
  isReadOnly: boolean;
  generatedAt: string;
  pastItems: readonly DividendInboxItem[];
  upcomingItems: readonly DividendInboxItem[];
}>;

