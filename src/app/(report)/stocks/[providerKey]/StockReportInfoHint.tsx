"use client";

import { Info } from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function StockReportInfoHint({
  text,
  ariaLabel = "Informacja",
}: Readonly<{
  text: string;
  ariaLabel?: string;
}>) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="inline-flex h-5 w-5 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
          aria-label={ariaLabel}
        >
          <Info className="size-4" aria-hidden />
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs border border-dashed border-[color:var(--report-rule)] bg-background text-foreground shadow-none">
        {text}
      </TooltipContent>
    </Tooltip>
  );
}
