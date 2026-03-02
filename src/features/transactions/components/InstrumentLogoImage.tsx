"use client";

import { useState } from "react";

import Image from "next/image";
import { Wallet } from "lucide-react";

import { buildLogoDevTickerProxyUrl } from "@/features/common/lib/logo-dev";
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
  loading?: "eager" | "lazy";
  priority?: boolean;
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
  src: _src,
  ticker,
  customAssetType,
  isCash = false,
  size,
  className,
  alt = "",
  fallbackText,
  loading = "lazy",
  priority = false,
}: Props) {
  void _src;
  const [didLogoDevFail, setDidLogoDevFail] = useState(false);

  const CustomAssetIcon = customAssetType ? customAssetTypeIcons[customAssetType] : null;
  const logoDevSrc = buildLogoDevTickerProxyUrl(ticker ?? fallbackText);
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

  if (logoDevSrc && !didLogoDevFail) {
    return (
      <Image
        alt={alt}
        className={cn("block rounded-full object-contain object-center", className)}
        height={size}
        loading={loading}
        onError={() => setDidLogoDevFail(true)}
        priority={priority}
        sizes={`${size}px`}
        src={logoDevSrc}
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
