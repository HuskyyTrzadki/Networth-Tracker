import { AppShell } from "@/features/app-shell";

type Props = Readonly<{
  children: React.ReactNode;
}>;

export default function AppLayout({ children }: Props) {
  return <AppShell>{children}</AppShell>;
}
