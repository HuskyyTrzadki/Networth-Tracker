"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/features/design-system/components/ui/button";
import { SheetClose } from "@/features/design-system/components/ui/sheet";

type Props = Readonly<{
  accountHref: string;
  className?: string;
}>;

export function ReportShellSignedInActions({
  accountHref,
  className,
}: Props) {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const onSignOut = async () => {
    if (isSigningOut) {
      return;
    }

    setIsSigningOut(true);
    await fetch("/api/auth/signout", { method: "POST" }).catch(() => null);
    router.push("/login");
    router.refresh();
    setIsSigningOut(false);
  };

  return (
    <>
      <SheetClose asChild>
        <Button
          asChild
          size="sm"
          variant="outline"
          className={className}
        >
          <Link href={accountHref}>Konto</Link>
        </Button>
      </SheetClose>
      <Button
        size="sm"
        variant="outline"
        className={className}
        onClick={onSignOut}
        disabled={isSigningOut}
      >
        {isSigningOut ? "Wylogowywanie..." : "Wyloguj"}
      </Button>
    </>
  );
}
