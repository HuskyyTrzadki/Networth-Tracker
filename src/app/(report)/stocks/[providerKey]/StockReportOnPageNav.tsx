"use client";

import { useEffect, useMemo, useState } from "react";

type NavItem = Readonly<{
  href: `#${string}`;
  label: string;
}>;

const canSmoothScroll = () => {
  if (typeof window === "undefined") return false;
  return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};

const getHeaderOffsetPx = () => 72;

export default function StockReportOnPageNav({
  items,
  className,
}: Readonly<{
  items: readonly NavItem[];
  className?: string;
}>) {
  const [activeHref, setActiveHref] = useState<NavItem["href"] | null>(
    items[0]?.href ?? null
  );

  const resolvedItems = useMemo(
    () =>
      items.map((item) => ({
        ...item,
        id: item.href.slice(1),
      })),
    [items]
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    let raf = 0;
    const offset = getHeaderOffsetPx() + 6;

    const update = () => {
      const y = window.scrollY + offset;
      let current: NavItem["href"] | null = resolvedItems[0]?.href ?? null;

      for (const item of resolvedItems) {
        const el = document.getElementById(item.id);
        if (!el) continue;
        const top = el.getBoundingClientRect().top + window.scrollY;
        if (top <= y) current = item.href;
      }

      setActiveHref(current);
    };

    const schedule = () => {
      window.cancelAnimationFrame(raf);
      raf = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    window.addEventListener("hashchange", schedule);
    window.addEventListener("popstate", schedule);

    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("hashchange", schedule);
      window.removeEventListener("popstate", schedule);
    };
  }, [resolvedItems]);

  return (
    <ul className={["mt-3 space-y-0.5 text-sm", className].filter(Boolean).join(" ")}>
      {resolvedItems.map((item) => {
        const isActive = activeHref === item.href;

        return (
          <li key={item.href}>
            <a
              href={item.href}
              aria-current={isActive ? "location" : undefined}
              className={[
                "group flex items-center gap-2 rounded-sm px-2 py-1 font-semibold tracking-tight transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                isActive
                  ? "bg-muted/35 text-foreground"
                  : "text-foreground/70 hover:bg-muted/25 hover:text-foreground",
              ].join(" ")}
            onClick={(event) => {
              // Let the browser handle "open in new tab", etc.
              if (
                event.defaultPrevented ||
                event.button !== 0 ||
                event.metaKey ||
                event.ctrlKey ||
                event.shiftKey ||
                event.altKey
              ) {
                return;
              }

              const target = document.querySelector(item.href);
              if (!target) return;

              event.preventDefault();

              const behavior: ScrollBehavior = canSmoothScroll() ? "smooth" : "auto";
              const y =
                target.getBoundingClientRect().top +
                window.scrollY -
                getHeaderOffsetPx();

              window.history.pushState(null, "", item.href);
              window.scrollTo({ top: y, behavior });
            }}
          >
            <span className="flex w-3 shrink-0 items-center justify-center">
              <span
                className={[
                  "rounded-full transition-colors",
                  isActive
                    ? "h-2 w-2 bg-foreground/70"
                    : "h-1.5 w-1.5 bg-muted-foreground/60 group-hover:bg-muted-foreground",
                ].join(" ")}
                aria-hidden
              />
            </span>
            <span className="min-w-0 truncate">{item.label}</span>
          </a>
        </li>
        );
      })}
    </ul>
  );
}
