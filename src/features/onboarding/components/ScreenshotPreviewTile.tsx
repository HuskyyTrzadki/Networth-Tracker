"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";

import { Button } from "@/features/design-system/components/ui/button";
import { cn } from "@/lib/cn";

export function ScreenshotPreviewTile({
  file,
  onRemove,
  className,
}: Readonly<{
  file: File;
  onRemove: () => void;
  className?: string;
}>) {
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [fallbackUrl, setFallbackUrl] = useState<string | null>(null);
  const fallbackAttemptedRef = useRef(false);
  const objectUrl = useMemo(() => URL.createObjectURL(file), [file]);
  const previewUrl = fallbackUrl ?? objectUrl;

  useEffect(() => {
    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [objectUrl]);

  const hasError = status === "error";
  const isLoading = status === "loading";

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-md border border-border/70 bg-muted/10",
        className
      )}
    >
      {previewUrl && !hasError ? (
        <img
          src={previewUrl}
          alt={file.name}
          className={cn(
            "h-full w-full object-cover transition-opacity duration-200",
            isLoading ? "opacity-0" : "opacity-100"
          )}
          onLoad={() => setStatus("ready")}
          onError={() => {
            if (fallbackAttemptedRef.current) {
              setStatus("error");
              return;
            }

            fallbackAttemptedRef.current = true;
            setStatus("loading");
            const reader = new FileReader();
            reader.onload = () => {
              if (typeof reader.result === "string") {
                setFallbackUrl(reader.result);
                setStatus("ready");
              } else {
                setStatus("error");
              }
            };
            reader.onerror = () => setStatus("error");
            reader.readAsDataURL(file);
          }}
        />
      ) : null}
      {hasError ? (
        <div className="flex h-full w-full items-center justify-center px-3 text-center text-xs text-muted-foreground">
          Brak podglądu
        </div>
      ) : null}
      {isLoading ? (
        <div className="absolute inset-0 flex items-center justify-center px-3 text-center text-xs text-muted-foreground">
          Wczytuję podgląd...
        </div>
      ) : null}
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-black/60 via-black/30 to-transparent px-2 py-2 text-[11px] text-white">
        <span className="truncate font-medium" title={file.name}>
          {file.name}
        </span>
        <Button
          type="button"
          variant="ghost"
          className="h-6 w-6 p-0 text-white hover:bg-white/15"
          onClick={onRemove}
          aria-label="Usuń zrzut"
        >
          <X className="size-3.5" aria-hidden />
        </Button>
      </div>
    </div>
  );
}
