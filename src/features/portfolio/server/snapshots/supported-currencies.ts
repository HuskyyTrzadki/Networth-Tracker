export const SNAPSHOT_CURRENCIES = ["PLN", "USD", "EUR"] as const;

export type SnapshotCurrency = (typeof SNAPSHOT_CURRENCIES)[number];
