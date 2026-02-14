import { ReportShell } from "@/features/app-shell";

type Props = Readonly<{
  children: React.ReactNode;
}>;

export default async function ReportLayout({ children }: Props) {
  return <ReportShell>{children}</ReportShell>;
}
