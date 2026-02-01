"use client";

import Image from "next/image";

import { Avatar, AvatarFallback } from "@/features/design-system/components/ui/avatar";
import { cn } from "@/lib/cn";

type Props = Readonly<{
  src?: string | null;
  size: number;
  className?: string;
  alt?: string;
  fallbackText: string;
}>;

const passthroughLoader = ({ src }: { src: string }) => src;

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
  if (!src) {
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
      loader={passthroughLoader}
      loading="lazy"
      src={src}
      unoptimized
      width={size}
    />
  );
}
