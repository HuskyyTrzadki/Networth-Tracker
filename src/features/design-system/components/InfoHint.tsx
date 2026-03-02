"use client";

import { Info } from "lucide-react";

import { cn } from "@/lib/cn";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type InfoHintProps = Readonly<{
  text: string;
  ariaLabel?: string;
  className?: string;
  contentClassName?: string;
}>;

export function InfoHint({
  text,
  ariaLabel = "Informacja",
  className,
  contentClassName,
}: InfoHintProps) {
  return (
    <TooltipProvider delayDuration={120}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={cn(
              "inline-flex size-5 items-center justify-center rounded-full border border-border/70 bg-background/80 text-muted-foreground transition-colors hover:text-foreground",
              className
            )}
            aria-label={ariaLabel}
          >
            <Info className="size-3.5" aria-hidden />
          </button>
        </TooltipTrigger>
        <TooltipContent
          className={cn(
            "max-w-xs border border-dashed border-black/15 bg-background text-foreground shadow-none",
            contentClassName
          )}
        >
          {text}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
