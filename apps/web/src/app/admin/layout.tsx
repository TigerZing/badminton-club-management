import { AppShell } from "@/components/app-shell";
import { requireAdmin } from "@/server/session";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  return (
    <AppShell user={user} admin>
      {children}
    </AppShell>
  );
}
