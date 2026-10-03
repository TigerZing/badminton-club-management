import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/server/session";

export default async function MemberLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return <AppShell user={user}>{children}</AppShell>;
}
