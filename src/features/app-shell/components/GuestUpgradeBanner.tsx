"use client";

import Link from "next/link";
import { startTransition, useEffect, useState } from "react";
import { CircleAlert, X } from "lucide-react";

import { dismissGuestUpgradeNudgeAction } from "@/features/auth/server/dismiss-guest-upgrade-nudge-action";
import type { GuestUpgradeBanner as GuestUpgradeBannerModel } from "@/features/auth/lib/guest-upgrade-nudge";
import { reportGuestUpgradeNudgeShownAction } from "@/features/auth/server/report-guest-upgrade-nudge-shown-action";
import { Button } from "@/features/design-system/components/ui/button";
import { cn } from "@/lib/cn";

type Props = Readonly<{
  banner: GuestUpgradeBannerModel;
  className?: string;
}>;

export function GuestUpgradeBanner({ banner, className }: Props) {
  const [dismissed, setDismissed] = useState(false);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    void reportGuestUpgradeNudgeShownAction(banner.step);
  }, [banner.step]);

  if (dismissed) {
    return null;
  }

  return (
    <section
      className={cn(
        "mb-6 flex items-start justify-between gap-4 rounded-md border border-amber-300/70 bg-amber-50/80 px-4 py-3 text-foreground shadow-[var(--surface-shadow)]",
        className
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-amber-300/70 bg-white/85 text-amber-700">
          <CircleAlert className="size-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold leading-5">{banner.title}</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            {banner.description}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Button asChild className="h-9 rounded-full px-4" size="sm">
          <Link href="/settings">Uaktualnij teraz</Link>
        </Button>
        <Button
          aria-label="Ukryj przypomnienie"
          className="h-9 w-9 rounded-full"
          disabled={isPending}
          onClick={() => {
            setIsPending(true);
            startTransition(async () => {
              try {
                await dismissGuestUpgradeNudgeAction(banner.step);
                setDismissed(true);
              } finally {
                setIsPending(false);
              }
            });
          }}
          size="icon"
          variant="ghost"
        >
          <X className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </section>
  );
}
