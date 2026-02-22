"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/features/design-system/components/ui/button";
import type { DividendInboxItem } from "@/features/portfolio/lib/dividend-inbox";

import { DividendBookingDialog } from "./DividendBookingDialog";

type Props = Readonly<{
  portfolioId: string | null;
  item: DividendInboxItem;
}>;

export function DividendInboxBookAction({ portfolioId, item }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  if (!portfolioId) {
    return null;
  }

  return (
    <>
      {item.canBook ? (
        <Button onClick={() => setIsOpen(true)} size="sm" type="button" variant="outline">
          Zaksięguj
        </Button>
      ) : item.isBooked ? null : (
        <Button disabled size="sm" type="button" variant="outline">
          Zaksięguj
        </Button>
      )}

      {isOpen ? (
        <DividendBookingDialog
          portfolioId={portfolioId}
          item={item}
          open={isOpen}
          onOpenChange={setIsOpen}
          onBooked={() => {
            setIsOpen(false);
            router.refresh();
          }}
        />
      ) : null}
    </>
  );
}
