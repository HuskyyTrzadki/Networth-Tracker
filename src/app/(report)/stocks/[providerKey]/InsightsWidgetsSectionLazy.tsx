"use client";

import dynamic from "next/dynamic";

function InsightsWidgetsSkeleton() {
  return (
    <div
      className="h-[460px] rounded-md border border-black/5 bg-white/85 p-4 shadow-[var(--surface-shadow)]"
      aria-hidden="true"
    >
      <div className="space-y-3 animate-pulse">
        <div className="h-4 w-48 rounded-sm bg-black/10" />
        <div className="h-3 w-56 rounded-sm bg-black/10" />
        <div className="grid h-[320px] grid-cols-1 gap-3 md:grid-cols-2">
          <div className="rounded-md border border-dashed border-black/15 bg-white/60" />
          <div className="rounded-md border border-dashed border-black/15 bg-white/60" />
        </div>
      </div>
    </div>
  );
}

const InsightsWidgetsSection = dynamic(
  () => import("./InsightsWidgetsSection"),
  {
    ssr: false,
    loading: () => <InsightsWidgetsSkeleton />,
  }
);

export default function InsightsWidgetsSectionLazy() {
  return <InsightsWidgetsSection />;
}
