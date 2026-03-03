"use client";

import dynamic from "next/dynamic";

import RenderOnVisible from "./RenderOnVisible";

const StockReportConceptSections = dynamic(
  () => import("./StockReportConceptSections"),
  {
    ssr: false,
    loading: () => (
      <div
        className="h-[480px] animate-pulse rounded-md border border-black/5 bg-white/85 shadow-[var(--surface-shadow)]"
        aria-hidden="true"
      />
    ),
  }
);

export default function StockReportConceptSectionsLazy() {
  return (
    <RenderOnVisible
      rootMargin="220px 0px"
      fallback={
        <div
          className="h-[480px] rounded-md border border-black/5 bg-white/70"
          aria-hidden="true"
        />
      }
    >
      <StockReportConceptSections />
    </RenderOnVisible>
  );
}
