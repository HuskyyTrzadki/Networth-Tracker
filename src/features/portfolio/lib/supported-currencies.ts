export const SNAPSHOT_CURRENCIES = ["PLN", "USD", "EUR"] as const;

export type SnapshotCurrency = (typeof SNAPSHOT_CURRENCIES)[number];

export type SnapshotCurrencyMap<T> = Readonly<Record<SnapshotCurrency, T>>;

export const buildSnapshotCurrencyMap = <T>(
  factory: (currency: SnapshotCurrency) => T
): SnapshotCurrencyMap<T> =>
  Object.fromEntries(
    SNAPSHOT_CURRENCIES.map((currency) => [currency, factory(currency)] as const)
  ) as SnapshotCurrencyMap<T>;
