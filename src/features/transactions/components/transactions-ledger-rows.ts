import type { TransactionListItem } from "../server/list-transactions";

const sortGroupItems = (items: readonly TransactionListItem[]) =>
  [...items].sort((a, b) => {
    if (a.legRole === b.legRole) return 0;
    if (a.legRole === "ASSET") return -1;
    return 1;
  });

export type TransactionGroup = Readonly<{
  groupId: string;
  items: readonly TransactionListItem[];
}>;

export const groupTransactions = (
  items: readonly TransactionListItem[]
): readonly TransactionGroup[] => {
  const groups = new Map<string, TransactionListItem[]>();
  const order: string[] = [];

  items.forEach((item) => {
    if (!groups.has(item.groupId)) {
      groups.set(item.groupId, []);
      order.push(item.groupId);
    }

    groups.get(item.groupId)?.push(item);
  });

  return order.map((groupId) => ({
    groupId,
    items: sortGroupItems(groups.get(groupId) ?? []),
  }));
};

export type LedgerRow = Readonly<{
  rowKey: string;
  item: TransactionListItem;
  isCashLeg: boolean;
  hasGroupDivider: boolean;
}>;

export const toLedgerRows = (
  items: readonly TransactionListItem[]
): readonly LedgerRow[] =>
  groupTransactions(items).flatMap((group) =>
    group.items.map((item, index) => ({
      rowKey: `${item.groupId}:${item.legKey}`,
      item,
      isCashLeg: item.legRole === "CASH",
      hasGroupDivider: index === group.items.length - 1,
    }))
  );
