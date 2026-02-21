"use client";

import Link from "next/link";
import { MoreHorizontal } from "lucide-react";

import { Button } from "@/features/design-system/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/features/design-system/components/ui/popover";
import { cn } from "@/lib/cn";
import type { TransactionListItem } from "../server/list-transactions";

const menuItemClasses =
  "flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm transition-colors hover:bg-muted/60";

export const canEditTransactionRow = (transaction: TransactionListItem) =>
  transaction.legRole === "ASSET";

export function TransactionsRowActions({
  transaction,
}: Readonly<{
  transaction: TransactionListItem;
}>) {
  const canEdit = canEditTransactionRow(transaction);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          aria-label="Więcej akcji"
          className="h-9 w-9"
          size="icon"
          type="button"
          variant="ghost"
        >
          <MoreHorizontal className="size-4" aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-40 p-1.5">
        {canEdit ? (
          <Link
            className={menuItemClasses}
            href={`/transactions/${transaction.id}/edit`}
            scroll={false}
          >
            Edytuj
          </Link>
        ) : null}
        <button
          className={cn(menuItemClasses, "text-destructive")}
          type="button"
        >
          Usuń
        </button>
      </PopoverContent>
    </Popover>
  );
}
