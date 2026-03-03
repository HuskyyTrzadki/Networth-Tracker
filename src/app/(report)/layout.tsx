import { cookies } from "next/headers";

import { ReportShell } from "@/features/app-shell/components/ReportShell";
import { getAuthUser } from "@/features/auth/server/service";

type Props = Readonly<{
  children: React.ReactNode;
}>;

export default async function ReportLayout({ children }: Props) {
  const user = await getAuthUser(await cookies());

  return <ReportShell hasSession={Boolean(user)}>{children}</ReportShell>;
}
