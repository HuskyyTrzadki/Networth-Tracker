"use client";

import { useState } from "react";

import Image from "next/image";

import { buildLogoDevTickerProxyUrl } from "@/features/common/lib/logo-dev";
import { buildRemoteImageProxyUrl } from "@/features/common/lib/remote-image";
import { Avatar, AvatarFallback } from "@/features/design-system/components/ui/avatar";
import { cn } from "@/lib/cn";

type Props = Readonly<{
  src?: string | null;
  ticker?: string | null;
  size: number;
  className?: string;
  alt?: string;
  fallbackText: string;
}>;

const getFallbackInitials = (value: string) =>
  value
    .trim()
    .split(/\s+/)
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();

export function InstrumentLogoImage({
  src,
  ticker,
  size,
  className,
  alt = "",
  fallbackText,
}: Props) {
  const [failedSources, setFailedSources] = useState<Record<string, true>>({});

  const primarySrc = buildRemoteImageProxyUrl(src);
  const fallbackSrc = buildLogoDevTickerProxyUrl(ticker ?? fallbackText);
  const didPrimaryFail = primarySrc ? Boolean(failedSources[primarySrc]) : false;
  const didFallbackFail = fallbackSrc ? Boolean(failedSources[fallbackSrc]) : false;

  if (primarySrc && !didPrimaryFail) {
    return (
      <Image
        alt={alt}
        className={cn("rounded-full object-contain", className)}
        height={size}
        loading="lazy"
        onError={() =>
          setFailedSources((current) =>
            current[primarySrc] ? current : { ...current, [primarySrc]: true }
          )
        }
        sizes={`${size}px`}
        src={primarySrc}
        width={size}
      />
    );
  }

  if (fallbackSrc && fallbackSrc !== primarySrc && !didFallbackFail) {
    return (
      <Image
        alt={alt}
        className={cn("rounded-full object-contain", className)}
        height={size}
        loading="lazy"
        onError={() =>
          setFailedSources((current) =>
            current[fallbackSrc] ? current : { ...current, [fallbackSrc]: true }
          )
        }
        sizes={`${size}px`}
        src={fallbackSrc}
        width={size}
      />
    );
  }

  return (
    <Avatar className={cn("bg-muted", className)} style={{ width: size, height: size }}>
      <AvatarFallback>{getFallbackInitials(fallbackText)}</AvatarFallback>
    </Avatar>
  );
}
