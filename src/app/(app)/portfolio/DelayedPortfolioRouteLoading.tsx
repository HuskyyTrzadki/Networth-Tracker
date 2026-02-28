"use client";

import { useEffect, useState } from "react";

import { APP_CONTENT_MAX_WIDTH_CLASS } from "@/features/app-shell/lib/layout";

import { PortfolioRouteLoading } from "./PortfolioRouteLoading";

const SKELETON_DELAY_MS = 150;

export function DelayedPortfolioRouteLoading() {
  const [shouldRenderSkeleton, setShouldRenderSkeleton] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setShouldRenderSkeleton(true);
    }, SKELETON_DELAY_MS);

    return () => window.clearTimeout(timeoutId);
  }, []);

  if (!shouldRenderSkeleton) {
    return (
      <main
        aria-busy="true"
        className={`mx-auto min-h-[calc(100vh-120px)] w-full px-6 py-8 ${APP_CONTENT_MAX_WIDTH_CLASS}`}
      />
    );
  }

  return <PortfolioRouteLoading />;
}
