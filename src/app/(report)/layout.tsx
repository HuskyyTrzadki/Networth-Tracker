import { Suspense } from "react";

import { newsreader } from "@/app/fonts";
import { ReportShell } from "@/features/app-shell/components/ReportShell";
import {
  ReportShellAccountControlsSlot,
  ReportShellGuestAccountControls,
} from "@/features/app-shell/components/ReportShellAccountControls";

type Props = Readonly<{
  children: React.ReactNode;
}>;

export default async function ReportLayout({ children }: Props) {
  return (
    <div className={newsreader.variable}>
      <ReportShell
        accountControls={
          <Suspense fallback={<ReportShellGuestAccountControls />}>
            <ReportShellAccountControlsSlot />
          </Suspense>
        }
      >
        {children}
      </ReportShell>
    </div>
  );
}
