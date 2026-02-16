"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, CircleAlert, Info, X } from "lucide-react";

import { Button } from "@/features/design-system/components/ui/button";
import { cn } from "@/lib/cn";

import {
  APP_TOAST_EVENT,
  type AppToastPayload,
} from "../lib/app-toast-events";

type ToastItem = Readonly<{
  id: string;
  title: string;
  description: string | null;
  tone: "default" | "success" | "destructive";
  action?: AppToastPayload["action"];
  durationMs: number;
  actionPending: boolean;
}>;

const DEFAULT_TOAST_DURATION_MS = 6_000;

const randomId = () => crypto.randomUUID();

const toneClassName = {
  default: "border-border/85 bg-card text-foreground",
  success: "border-emerald-500/30 bg-emerald-500/[0.07] text-foreground",
  destructive: "border-rose-500/35 bg-rose-500/[0.08] text-foreground",
} as const;

const toneIconClassName = {
  default: "text-muted-foreground",
  success: "text-emerald-700 dark:text-emerald-300",
  destructive: "text-rose-700 dark:text-rose-300",
} as const;

const ToneIcon = ({ tone }: Readonly<{ tone: ToastItem["tone"] }>) => {
  if (tone === "success") {
    return <CheckCircle2 className={cn("size-4", toneIconClassName[tone])} aria-hidden />;
  }
  if (tone === "destructive") {
    return <CircleAlert className={cn("size-4", toneIconClassName[tone])} aria-hidden />;
  }
  return <Info className={cn("size-4", toneIconClassName[tone])} aria-hidden />;
};

export function AppToastHost() {
  const [toasts, setToasts] = useState<readonly ToastItem[]>([]);

  useEffect(() => {
    const handleEvent = (event: Event) => {
      const payload = (event as CustomEvent<AppToastPayload>).detail;
      if (!payload?.title) return;

      const nextToast: ToastItem = {
        id: payload.id ?? randomId(),
        title: payload.title,
        description: payload.description ?? null,
        tone: payload.tone ?? "default",
        action: payload.action,
        durationMs: payload.durationMs ?? DEFAULT_TOAST_DURATION_MS,
        actionPending: false,
      };

      setToasts((current) => [...current, nextToast].slice(-3));
    };

    window.addEventListener(APP_TOAST_EVENT, handleEvent);
    return () => window.removeEventListener(APP_TOAST_EVENT, handleEvent);
  }, []);

  useEffect(() => {
    if (toasts.length === 0) return;

    const timers = toasts.map((toast) =>
      window.setTimeout(() => {
        setToasts((current) => current.filter((item) => item.id !== toast.id));
      }, toast.durationMs)
    );

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [toasts]);

  const visibleToasts = useMemo(() => [...toasts].reverse(), [toasts]);

  if (visibleToasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-3 bottom-[5.25rem] z-[70] flex flex-col gap-2 md:inset-x-auto md:right-4 md:bottom-4 md:w-[360px]">
      {visibleToasts.map((toast) => (
        <article
          key={toast.id}
          className={cn(
            "pointer-events-auto rounded-lg border px-3 py-3 shadow-[var(--shadow)]",
            toneClassName[toast.tone]
          )}
          role="status"
        >
          <div className="flex items-start gap-2.5">
            <ToneIcon tone={toast.tone} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold leading-5">{toast.title}</p>
              {toast.description ? (
                <p className="mt-0.5 text-xs text-muted-foreground">{toast.description}</p>
              ) : null}
              <div className="mt-2 flex items-center gap-2">
                {toast.action ? (
                  <Button
                    className="h-8 px-2.5 text-xs"
                    type="button"
                    variant="outline"
                    disabled={toast.actionPending}
                    onClick={() => {
                      setToasts((current) =>
                        current.map((item) =>
                          item.id === toast.id
                            ? { ...item, actionPending: true }
                            : item
                        )
                      );
                      void Promise.resolve(toast.action?.onClick()).finally(() => {
                        setToasts((current) =>
                          current.filter((item) => item.id !== toast.id)
                        );
                      });
                    }}
                  >
                    {toast.action.label}
                  </Button>
                ) : null}
                <Button
                  aria-label="Zamknij powiadomienie"
                  className="h-8 w-8 p-0"
                  onClick={() => {
                    setToasts((current) =>
                      current.filter((item) => item.id !== toast.id)
                    );
                  }}
                  size="icon"
                  type="button"
                  variant="ghost"
                >
                  <X className="size-4" aria-hidden />
                </Button>
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
