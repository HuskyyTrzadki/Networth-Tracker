"use client";

import { usePathname } from "next/navigation";

type Props = Readonly<{
  children: React.ReactNode;
}>;

export function DemoAccountPageFooter({ children }: Props) {
  const pathname = usePathname() ?? "/";

  if (pathname === "/settings" || pathname === "/onboarding") {
    return null;
  }

  return <>{children}</>;
}
