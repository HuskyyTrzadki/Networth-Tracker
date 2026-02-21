"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoaderCircle, MoreHorizontal } from "lucide-react";

import { dispatchAppToast } from "@/features/app-shell/lib/app-toast-events";
import { Button } from "@/features/design-system/components/ui/button";
import { dispatchSnapshotRebuildTriggeredEvent } from "@/features/portfolio/lib/snapshot-rebuild-events";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/features/design-system/components/ui/popover";
import { cn } from "@/lib/cn";
import { deleteTransaction } from "../client/delete-transaction";
import type { TransactionListItem } from "../server/list-transactions";
import { triggerSnapshotRebuild } from "./add-transaction/submit-helpers";

const menuItemClasses =
  "flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm transition-colors hover:bg-muted/60";

export const canEditTransactionRow = (transaction: TransactionListItem) =>
  transaction.legRole === "ASSET";

export function TransactionsRowActions({
  transaction,
  onDeleted,
}: Readonly<{
  transaction: TransactionListItem;
  onDeleted?: (deletedGroupId: string) => void;
}>) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const canEdit = canEditTransactionRow(transaction);
  const isAssetRow = transaction.legRole === "ASSET";

  const handleDelete = async () => {
    if (isDeleting) {
      return;
    }

    const isConfirmed = window.confirm(
      isAssetRow
        ? "Usunąć transakcję? Operacja usunie też powiązane rozliczenia gotówki."
        : "Usunąć ten zapis? Operacja usunie całą grupę transakcji."
    );
    if (!isConfirmed) {
      return;
    }

    setIsDeleting(true);
    try {
      const deleted = await deleteTransaction(transaction.id);
      dispatchSnapshotRebuildTriggeredEvent({
        scope: "PORTFOLIO",
        portfolioId: deleted.portfolioId,
      });
      dispatchSnapshotRebuildTriggeredEvent({
        scope: "ALL",
        portfolioId: null,
      });
      triggerSnapshotRebuild("PORTFOLIO", deleted.portfolioId);
      triggerSnapshotRebuild("ALL", null);
      onDeleted?.(transaction.groupId);
      router.refresh();
      dispatchAppToast({
        title: "Transakcja usunięta.",
        description: "Zmiany zostały zapisane.",
        tone: "success",
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Nie udało się usunąć transakcji.";
      dispatchAppToast({
        title: "Nie udało się usunąć transakcji.",
        description: message,
        tone: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

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
          href={`/transactions/${transaction.groupId}/edit`}
          scroll={false}
        >
          Edytuj
        </Link>
      ) : null}
        <button
          className={cn(menuItemClasses, "text-destructive")}
          disabled={isDeleting}
          onClick={() => {
            void handleDelete();
          }}
          type="button"
        >
          {isDeleting ? (
            <>
              <LoaderCircle className="size-4 animate-spin" aria-hidden />
              Usuwanie...
            </>
          ) : (
            "Usuń"
          )}
        </button>
      </PopoverContent>
    </Popover>
  );
}
