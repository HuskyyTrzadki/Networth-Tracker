"use client";

import Image from "next/image";

import { cn } from "@/lib/cn";

type Props = Readonly<{
  src: string;
  size: number;
  className?: string;
  alt?: string;
}>;

const passthroughLoader = ({ src }: { src: string }) => src;

export function InstrumentLogoImage({
  src,
  size,
  className,
  alt = "",
}: Props) {
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
