import type { Slice } from "./stock-report-revenue-mix-helpers";

export type RevenueBreakdownCardViewModel = Readonly<{
  title: string;
  nowSlices: readonly Slice[];
  nowEmptyState: string;
  historyEmptyState: string;
}>;
