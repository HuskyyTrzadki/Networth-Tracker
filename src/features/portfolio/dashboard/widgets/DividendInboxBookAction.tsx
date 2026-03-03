"use client";

import { useState } from "react";

import { StatusStrip } from "@/features/design-system/components/StatusStrip";
import { Button } from "@/features/design-system/components/ui/button";
import type { DividendInboxItem } from "@/features/portfolio/lib/dividend-inbox";

import { DividendBookingDialog } from "./DividendBookingDialog";

type Props = Readonly<{
  portfolioId: string | null;
  item: DividendInboxItem;
}>;

export function DividendInboxBookAction({ portfolioId, item }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [submitState, setSubmitState] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );

  if (!portfolioId) {
    return null;
  }

  return (
    <>
      <div className="flex items-center gap-2">
        {item.canBook ? (
          <Button
            onClick={() => {
              setSubmitState("idle");
              setIsOpen(true);
            }}
            size="sm"
            type="button"
            variant="outline"
          >
            Zaksięguj
          </Button>
        ) : item.isBooked ? null : (
          <Button disabled size="sm" type="button" variant="outline">
            Zaksięguj
          </Button>
        )}
        {submitState === "loading" ? (
          <StatusStrip label="Status: księgowanie" />
        ) : null}
        {submitState === "success" ? (
          <StatusStrip label="Status: zaksięgowano" tone="positive" />
        ) : null}
        {submitState === "error" ? (
          <StatusStrip
            hint="Sprawdź dane netto i spróbuj ponownie."
            label="Status: błąd"
            tone="negative"
          />
        ) : null}
      </div>

      {isOpen ? (
        <DividendBookingDialog
          portfolioId={portfolioId}
          item={item}
          open={isOpen}
          onOpenChange={(next) => {
            setIsOpen(next);
            if (!next && submitState === "loading") {
              setSubmitState("idle");
            }
          }}
          onSubmitStateChange={(state) => {
            setSubmitState(state);
          }}
          onBooked={() => {
            setSubmitState("success");
            setIsOpen(false);
          }}
        />
      ) : null}
    </>
  );
}
