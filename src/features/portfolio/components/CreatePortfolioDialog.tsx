"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/features/design-system/components/ui/dialog";
import type { CreatePortfolioInput } from "../lib/create-portfolio-schema";

const CreatePortfolioDialogForm = dynamic(
  () =>
    import("./CreatePortfolioDialogForm").then(
      (module) => module.CreatePortfolioDialogForm
    ),
  {
    ssr: false,
    loading: () => (
      <div className="px-6 py-8 text-sm text-muted-foreground">
        Ładowanie formularza...
      </div>
    ),
  }
);

export type CreatePortfolioDialogProps = Readonly<{
  disabled?: boolean;
  onCreated: (createdPortfolioId: string) => void;
  trigger: (controls: { open: () => void; disabled: boolean }) => React.ReactNode;
  createPortfolioFn?: (input: CreatePortfolioInput) => Promise<{ id: string }>;
}>;

export function CreatePortfolioDialog({
  disabled = false,
  onCreated,
  trigger,
  createPortfolioFn,
}: CreatePortfolioDialogProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <Dialog
      open={isDialogOpen}
      onOpenChange={(nextOpen) => {
        setIsDialogOpen(nextOpen);
      }}
    >
      {trigger({
        open: () => setIsDialogOpen(true),
        disabled,
      })}

      <DialogContent className="p-0 sm:max-w-md">
        <DialogTitle className="sr-only">Nowy portfel</DialogTitle>
        <DialogDescription className="sr-only">
          Osobny koszyk aktywów.
        </DialogDescription>
        {isDialogOpen ? (
          <CreatePortfolioDialogForm
            createPortfolioFn={createPortfolioFn}
            onCancel={() => setIsDialogOpen(false)}
            onCreated={(createdId) => {
              setIsDialogOpen(false);
              onCreated(createdId);
            }}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
