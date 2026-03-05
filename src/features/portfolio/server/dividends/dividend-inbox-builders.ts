import { isSupportedCashCurrency } from "@/features/transactions/lib/system-currencies";
import type { DividendInboxItem, DividendMarket } from "@/features/portfolio/lib/dividend-inbox";

const sortByDateDescThenSymbol = (a: DividendInboxItem, b: DividendInboxItem) => {
  if (a.eventDate === b.eventDate) {
    return a.symbol.localeCompare(b.symbol);
  }

  return b.eventDate.localeCompare(a.eventDate);
};

const sortByDateAscThenSymbol = (a: DividendInboxItem, b: DividendInboxItem) => {
  if (a.eventDate === b.eventDate) {
    return a.symbol.localeCompare(b.symbol);
  }

  return a.eventDate.localeCompare(b.eventDate);
};

type SmartDefault = Readonly<{
  netSuggested: string | null;
  hint: string | null;
}>;

export const buildPastDividendInboxItem = (input: Readonly<{
  providerKey: string;
  symbol: string;
  name: string;
  eventDate: string;
  payoutCurrency: string;
  amountPerShare: string | null;
  estimatedShares: string;
  estimatedGross: string | null;
  market: DividendMarket;
  smartDefault: SmartDefault;
  dividendEventKey: string;
}>): DividendInboxItem => ({
  dividendEventKey: input.dividendEventKey,
  providerKey: input.providerKey,
  symbol: input.symbol,
  name: input.name,
  eventDate: input.eventDate,
  payoutCurrency: input.payoutCurrency,
  amountPerShare: input.amountPerShare,
  estimatedShares: input.estimatedShares,
  estimatedGross: input.estimatedGross,
  netSuggested: input.smartDefault.netSuggested,
  smartDefaultHint: input.smartDefault.hint,
  market: input.market,
  isBooked: false,
  canBook: false,
  disabledReason: null,
});

export const buildUpcomingDividendInboxItem = (input: Readonly<{
  providerKey: string;
  symbol: string;
  name: string;
  eventDate: string;
  payoutCurrency: string;
  amountPerShare: string | null;
  estimatedShares: string;
  estimatedGross: string | null;
  market: DividendMarket;
  smartDefault: SmartDefault;
  dividendEventKey: string;
}>): DividendInboxItem => ({
  dividendEventKey: input.dividendEventKey,
  providerKey: input.providerKey,
  symbol: input.symbol,
  name: input.name,
  eventDate: input.eventDate,
  payoutCurrency: input.payoutCurrency,
  amountPerShare: input.amountPerShare,
  estimatedShares: input.estimatedShares,
  estimatedGross: input.estimatedGross,
  netSuggested: input.smartDefault.netSuggested,
  smartDefaultHint: input.smartDefault.hint,
  market: input.market,
  isBooked: false,
  canBook: false,
  disabledReason: "Dostępne do zaksięgowania po dniu wypłaty.",
});

export const finalizePastDividendItems = (input: Readonly<{
  rawItems: readonly DividendInboxItem[];
  bookedKeys: ReadonlySet<string>;
  isReadOnly: boolean;
}>): readonly DividendInboxItem[] =>
  input.rawItems
    .map((item) => {
      const isBooked = input.bookedKeys.has(item.dividendEventKey);
      const isSupportedCurrency = isSupportedCashCurrency(item.payoutCurrency);

      return {
        ...item,
        isBooked,
        canBook: !input.isReadOnly && !isBooked && isSupportedCurrency,
        disabledReason:
          isBooked
            ? null
            : !isSupportedCurrency
              ? `Waluta ${item.payoutCurrency} nie jest jeszcze obsługiwana dla księgowania.`
              : null,
      } satisfies DividendInboxItem;
    })
    .sort(sortByDateDescThenSymbol);

export const finalizeUpcomingDividendItems = (input: Readonly<{
  items: readonly DividendInboxItem[];
  bookedKeys: ReadonlySet<string>;
}>): readonly DividendInboxItem[] =>
  input.items
    .map((item) => ({
      ...item,
      isBooked: input.bookedKeys.has(item.dividendEventKey),
    }))
    .sort(sortByDateAscThenSymbol);
