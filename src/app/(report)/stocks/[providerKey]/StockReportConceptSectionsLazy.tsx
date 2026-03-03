"use client";

import dynamic from "next/dynamic";

import RenderOnVisible from "./RenderOnVisible";

function ConceptSectionsSkeleton() {
  return (
    <div
      className="h-[480px] rounded-md border border-black/5 bg-white/85 p-4 shadow-[var(--surface-shadow)]"
      aria-hidden="true"
    >
      <div className="space-y-3 animate-pulse">
        <div className="h-4 w-56 rounded-sm bg-black/10" />
        <div className="h-3 w-64 rounded-sm bg-black/10" />
        <div className="h-[300px] rounded-md border border-dashed border-black/15 bg-white/60" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-20 rounded-md border border-dashed border-black/15 bg-white/60" />
          <div className="h-20 rounded-md border border-dashed border-black/15 bg-white/60" />
        </div>
      </div>
    </div>
  );
}

const StockReportConceptSections = dynamic(
  () => import("./StockReportConceptSections"),
  {
    ssr: false,
    loading: () => <ConceptSectionsSkeleton />,
  }
);

export default function StockReportConceptSectionsLazy() {
  return (
    <RenderOnVisible
      rootMargin="220px 0px"
      fallback={<ConceptSectionsSkeleton />}
    >
      <StockReportConceptSections />
    </RenderOnVisible>
  );
}
