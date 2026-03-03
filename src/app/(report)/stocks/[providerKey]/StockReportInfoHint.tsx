"use client";

import { InfoHint } from "@/features/design-system/components/InfoHint";

export default function StockReportInfoHint({
  text,
  ariaLabel = "Informacja",
}: Readonly<{
  text: string;
  ariaLabel?: string;
}>) {
  return <InfoHint text={text} ariaLabel={ariaLabel} className="border-none bg-transparent" />;
}
