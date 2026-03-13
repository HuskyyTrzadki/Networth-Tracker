"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { LoaderCircle, MoreHorizontal } from "lucide-react";

import { dispatchAppToast } from "@/features/app-shell/lib/app-toast-events";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/features/design-system/components/ui/alert-dialog";
import { Button } from "@/features/design-system/components/ui/button";
import { dispatchSnapshotRebuildTriggeredEvent } from "@/features/portfolio/lib/snapshot-rebuild-events";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/features/design-system/components/ui/popover";
import { cn } from "@/lib/cn";
import { deleteTransactionAction } from "../server/transaction-actions";
import type { TransactionListItem } from "../server/list-transactions";
import { triggerSnapshotRebuild } from "./add-transaction/submit-helpers";

const menuItemClasses =
  "flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm transition-colors hover:bg-muted/38";

export const canEditTransactionRow = (transaction: TransactionListItem) =>
  transaction.legRole === "ASSET";

export function TransactionsRowActions({
  transaction,
  onDeleteOptimistic,
  onDeleteRollback,
}: Readonly<{
  transaction: TransactionListItem;
  onDeleteOptimistic: (deletedGroupId: string) => void;
  onDeleteRollback: (deletedGroupId: string) => void;
}>) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [, startDeleteTransition] = useTransition();
  const canEdit = canEditTransactionRow(transaction);
  const isAssetRow = transaction.legRole === "ASSET";

  const handleDeleteConfirm = () => {
    if (isDeleting) {
      return;
    }

    setIsDeleting(true);
    startDeleteTransition(() => {
      onDeleteOptimistic(transaction.groupId);
      void deleteTransactionAction(transaction.id)
        .then((deleted) => {
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
          dispatchAppToast({
            title: "Transakcja usunięta.",
            description: "Zmiany zostały zapisane.",
            tone: "success",
          });
          setIsConfirmDeleteOpen(false);
        })
        .catch((error: unknown) => {
          onDeleteRollback(transaction.groupId);
          const message =
            error instanceof Error
              ? error.message
              : "Nie udało się usunąć transakcji.";
          dispatchAppToast({
            title: "Nie udało się usunąć transakcji.",
            description: message,
            tone: "destructive",
          });
        })
        .finally(() => {
          setIsDeleting(false);
        });
    });
  };

  return (
    <>
      <div className="flex items-center gap-1">
        {canEdit ? (
          <Link
            className="inline-flex h-8 items-center rounded-full px-3 text-xs font-medium text-foreground transition-colors hover:bg-muted/30"
            href={`/transactions/${transaction.groupId}/edit`}
            scroll={false}
          >
            Edytuj
          </Link>
        ) : null}
        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              aria-label="Więcej akcji"
              className="h-8 w-8 rounded-full"
              size="icon"
              type="button"
              variant="ghost"
            >
              <MoreHorizontal className="size-4" aria-hidden />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-40 p-1.5">
            <button
              className={cn(menuItemClasses, "text-[color:var(--loss)]")}
              disabled={isDeleting}
              onClick={() => {
                setIsPopoverOpen(false);
                setIsConfirmDeleteOpen(true);
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
      </div>
      <AlertDialog
        open={isConfirmDeleteOpen}
        onOpenChange={(nextOpen) => {
          if (isDeleting) {
            return;
          }
          setIsConfirmDeleteOpen(nextOpen);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Usunąć transakcję?</AlertDialogTitle>
            <AlertDialogDescription>
              {isAssetRow
                ? "Operacja usunie też powiązane rozliczenia gotówki."
                : "Operacja usunie całą grupę transakcji."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Anuluj</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={(event) => {
                event.preventDefault();
                handleDeleteConfirm();
              }}
            >
              {isDeleting ? "Usuwanie..." : "Usuń"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
