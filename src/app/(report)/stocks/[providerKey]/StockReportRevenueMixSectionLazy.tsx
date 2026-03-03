"use client";

import dynamic from "next/dynamic";

import RenderOnVisible from "./RenderOnVisible";

const StockReportRevenueMixSection = dynamic(
  () => import("./StockReportRevenueMixSection"),
  {
    ssr: false,
    loading: () => (
      <div
        className="h-[560px] animate-pulse rounded-md border border-black/5 bg-white/85 shadow-[var(--surface-shadow)]"
        aria-hidden="true"
      />
    ),
  }
);

export default function StockReportRevenueMixSectionLazy() {
  return (
    <RenderOnVisible
      rootMargin="360px 0px"
      fallback={
        <div
          className="h-[560px] rounded-md border border-black/5 bg-white/70"
          aria-hidden="true"
        />
      }
    >
      <StockReportRevenueMixSection />
    </RenderOnVisible>
  );
}
