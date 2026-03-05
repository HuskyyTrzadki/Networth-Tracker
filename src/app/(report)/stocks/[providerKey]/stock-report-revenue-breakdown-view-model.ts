import type { Slice } from "./stock-report-revenue-mix-helpers";

export type RevenueBreakdownCardViewModel = Readonly<{
  title: string;
  nowSubtitle: string;
  note: string;
  nowSlices: readonly Slice[];
  nowEmptyState: string;
  historyEmptyState: string;
}>;
