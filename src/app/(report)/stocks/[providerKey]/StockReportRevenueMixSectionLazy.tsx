"use client";

import dynamic from "next/dynamic";

import RenderOnVisible from "./RenderOnVisible";

function RevenueMixSectionSkeleton() {
  return (
    <div
      className="h-[560px] rounded-md border border-black/5 bg-white/85 p-4 shadow-[var(--surface-shadow)]"
      aria-hidden="true"
    >
      <div className="space-y-3 animate-pulse">
        <div className="h-4 w-40 rounded-sm bg-black/10" />
        <div className="h-3 w-52 rounded-sm bg-black/10" />
        <div className="h-[360px] rounded-md border border-dashed border-black/15 bg-white/60" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-24 rounded-md border border-dashed border-black/15 bg-white/60" />
          <div className="h-24 rounded-md border border-dashed border-black/15 bg-white/60" />
        </div>
      </div>
    </div>
  );
}

const StockReportRevenueMixSection = dynamic(
  () => import("./StockReportRevenueMixSection"),
  {
    ssr: false,
    loading: () => <RevenueMixSectionSkeleton />,
  }
);

export default function StockReportRevenueMixSectionLazy() {
  return (
    <RenderOnVisible
      rootMargin="360px 0px"
      fallback={<RevenueMixSectionSkeleton />}
    >
      <StockReportRevenueMixSection />
    </RenderOnVisible>
  );
}
