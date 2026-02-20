"use client";

import dynamic from "next/dynamic";

const InsightsWidgetsSection = dynamic(
  () => import("./InsightsWidgetsSection"),
  {
    ssr: false,
    loading: () => (
      <div
        className="h-[460px] animate-pulse rounded-md border border-black/5 bg-white/85 shadow-[var(--surface-shadow)]"
        aria-hidden="true"
      />
    ),
  }
);

export default function InsightsWidgetsSectionLazy() {
  return <InsightsWidgetsSection />;
}
