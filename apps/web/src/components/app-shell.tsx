import Link from "next/link";
import { CalendarDays, LayoutGrid, LogOut, MapPin, Shield, User } from "lucide-react";
import type { User as DbUser } from "@club/db";
import { getT } from "@/lib/i18n/server";
import type { MessageKey } from "@/lib/i18n/translate";
import { logoutAction } from "@/server/actions/auth";
import { LanguageSwitch } from "./language-switch";
import { NavLink } from "./nav-link";

const memberTabs = [
  { href: "/events", label: "nav.events" as MessageKey, icon: CalendarDays },
  { href: "/courts", label: "nav.courts" as MessageKey, icon: MapPin },
  { href: "/me", label: "nav.me" as MessageKey, icon: User },
];

const adminLinks = [
  { href: "/admin", label: "nav.overview" as MessageKey },
  { href: "/admin/events", label: "nav.events" as MessageKey },
  { href: "/admin/members", label: "nav.members" as MessageKey },
  { href: "/admin/venues", label: "nav.venues" as MessageKey },
];

export async function AppShell({ user, admin, children }: { user: DbUser; admin?: boolean; children: React.ReactNode }) {
  const { t } = await getT();
  return (
    <div className="mx-auto flex min-h-dvh max-w-3xl flex-col">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
        <div className="flex h-14 items-center justify-between px-4">
          <Link href="/events" className="font-semibold">
            🏸 {t("common.appName")}
          </Link>
          <div className="flex items-center gap-1">
            <LanguageSwitch className="mr-1" />
            {user.role === "ADMIN" && (
              <Link
                href={admin ? "/events" : "/admin"}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm hover:bg-muted"
              >
                {admin ? <LayoutGrid className="size-4" /> : <Shield className="size-4" />}
                {admin ? t("nav.memberView") : t("nav.admin")}
              </Link>
            )}
            <form action={logoutAction}>
              <button className="inline-flex size-9 items-center justify-center rounded-lg hover:bg-muted" aria-label={t("nav.signOut")}>
                <LogOut className="size-4" />
              </button>
            </form>
          </div>
        </div>
        {admin && (
          <nav className="flex gap-1 overflow-x-auto px-4 pb-2">
            {adminLinks.map((l) => (
              <NavLink key={l.href} href={l.href} exact={l.href === "/admin"} variant="pill">
                {t(l.label)}
              </NavLink>
            ))}
          </nav>
        )}
      </header>

      <main className={admin ? "flex-1 px-4 py-5" : "flex-1 px-4 pt-5 pb-24"}>{children}</main>

      {!admin && (
        <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-card pb-[env(safe-area-inset-bottom)]">
          <div className="mx-auto grid max-w-3xl grid-cols-3">
            {memberTabs.map((tab) => (
              <NavLink key={tab.href} href={tab.href} variant="tab">
                <tab.icon className="size-5" />
                <span>{t(tab.label)}</span>
              </NavLink>
            ))}
          </div>
        </nav>
      )}
    </div>
  );
}
