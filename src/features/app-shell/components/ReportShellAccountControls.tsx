import Link from "next/link";
import { cookies } from "next/headers";

import { getAuthUser } from "@/features/auth/server/service";
import { Button } from "@/features/design-system/components/ui/button";
import { SheetClose } from "@/features/design-system/components/ui/sheet";

import { ReportShellSignedInActions } from "./ReportShellSignedInActions";

const ACCOUNT_BUTTON_CLASS =
  "h-9 border-[color:var(--report-rule)] px-3 text-sm";

export function ReportShellGuestAccountControls() {
  return (
    <SheetClose asChild>
      <Button
        asChild
        size="sm"
        variant="outline"
        className={ACCOUNT_BUTTON_CLASS}
      >
        <Link href="/login">Konto</Link>
      </Button>
    </SheetClose>
  );
}

export async function ReportShellAccountControlsSlot() {
  const user = await getAuthUser(await cookies());

  if (!user) {
    return <ReportShellGuestAccountControls />;
  }

  return (
    <ReportShellSignedInActions
      accountHref="/settings"
      className={ACCOUNT_BUTTON_CLASS}
    />
  );
}
