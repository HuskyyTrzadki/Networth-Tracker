"use client";

import dynamic from "next/dynamic";

const InsightsWidgetsSection = dynamic(
  () => import("./InsightsWidgetsSection"),
  {
    ssr: false,
    loading: () => (
      <div
        className="h-[460px] animate-pulse rounded-sm border border-dashed border-[color:var(--report-rule)] bg-card/35"
        aria-hidden="true"
      />
    ),
  }
);

export default function InsightsWidgetsSectionLazy() {
  return <InsightsWidgetsSection />;
}
