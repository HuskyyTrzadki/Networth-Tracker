import { AppShell } from "@/features/app-shell";

type Props = Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>;

export default function AppLayout({ children, modal }: Props) {
  return (
    <>
      <AppShell>{children}</AppShell>
      {modal}
    </>
  );
}
