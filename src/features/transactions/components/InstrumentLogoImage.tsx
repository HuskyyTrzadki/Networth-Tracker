"use client";

import Image from "next/image";

import { buildRemoteImageProxyUrl } from "@/features/common/lib/remote-image";
import { Avatar, AvatarFallback } from "@/features/design-system/components/ui/avatar";
import { cn } from "@/lib/cn";

type Props = Readonly<{
  src?: string | null;
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
  size,
  className,
  alt = "",
  fallbackText,
}: Props) {
  const resolvedSrc = buildRemoteImageProxyUrl(src);
  if (!resolvedSrc) {
    return (
      <Avatar className={cn("bg-muted", className)} style={{ width: size, height: size }}>
        <AvatarFallback>{getFallbackInitials(fallbackText)}</AvatarFallback>
      </Avatar>
    );
  }

  return (
    <Image
      alt={alt}
      className={cn("rounded-full object-contain", className)}
      height={size}
      loading="lazy"
      sizes={`${size}px`}
      src={resolvedSrc}
      width={size}
    />
  );
}
