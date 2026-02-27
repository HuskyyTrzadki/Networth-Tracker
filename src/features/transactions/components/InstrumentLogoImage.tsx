"use client";

import { useState } from "react";

import Image from "next/image";
import { Wallet } from "lucide-react";

import { buildLogoDevTickerProxyUrl } from "@/features/common/lib/logo-dev";
import { buildRemoteImageProxyUrl } from "@/features/common/lib/remote-image";
import { Avatar, AvatarFallback } from "@/features/design-system/components/ui/avatar";
import { cn } from "@/lib/cn";
import type { CustomAssetType } from "../lib/custom-asset-types";
import { customAssetTypeIcons } from "./custom-asset-icons";

type Props = Readonly<{
  src?: string | null;
  ticker?: string | null;
  customAssetType?: CustomAssetType | null;
  isCash?: boolean;
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
  customAssetType,
  isCash = false,
  size,
  className,
  alt = "",
  fallbackText,
}: Props) {
  const [failedSources, setFailedSources] = useState<Record<string, true>>({});

  const CustomAssetIcon = customAssetType ? customAssetTypeIcons[customAssetType] : null;
  const primarySrc = buildRemoteImageProxyUrl(src);
  const fallbackSrc = buildLogoDevTickerProxyUrl(ticker ?? fallbackText);
  const didPrimaryFail = primarySrc ? Boolean(failedSources[primarySrc]) : false;
  const didFallbackFail = fallbackSrc ? Boolean(failedSources[fallbackSrc]) : false;
  const iconSize = Math.max(12, Math.round(size * 0.58));

  if (CustomAssetIcon) {
    return (
      <Avatar className={cn("bg-muted", className)} style={{ width: size, height: size }}>
        <AvatarFallback className="flex items-center justify-center bg-muted">
          <CustomAssetIcon
            aria-hidden
            className="text-muted-foreground"
            style={{ width: iconSize, height: iconSize }}
          />
        </AvatarFallback>
      </Avatar>
    );
  }

  if (isCash) {
    return (
      <Avatar className={cn("bg-muted", className)} style={{ width: size, height: size }}>
        <AvatarFallback className="flex items-center justify-center bg-muted">
          <Wallet
            aria-hidden
            className="text-muted-foreground"
            style={{ width: iconSize, height: iconSize }}
          />
        </AvatarFallback>
      </Avatar>
    );
  }

  if (primarySrc && !didPrimaryFail) {
    return (
      <Image
        alt={alt}
        className={cn("block rounded-full object-contain object-center", className)}
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
        className={cn("block rounded-full object-contain object-center", className)}
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
      <AvatarFallback className="flex items-center justify-center">
        {getFallbackInitials(fallbackText)}
      </AvatarFallback>
    </Avatar>
  );
}
