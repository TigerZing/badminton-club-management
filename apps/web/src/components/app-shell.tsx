import Link from "next/link";
import { CalendarDays, LayoutGrid, LogOut, MapPin, Shield, User } from "lucide-react";
import type { User as DbUser } from "@club/db";
import { getT } from "@/lib/i18n/server";
import type { MessageKey } from "@/lib/i18n/translate";
import { logoutAction } from "@/server/actions/auth";
import { BrandMark } from "./brand";
import { LanguageSwitch } from "./language-switch";
import { NavLink } from "./nav-link";
import { ThemeToggle } from "./theme-toggle";

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
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/75 backdrop-blur-xl">
        <div className="flex h-14 items-center justify-between px-4">
          <Link href="/events" className="flex items-center gap-2 font-bold tracking-tight">
            <BrandMark />
            <span className="whitespace-nowrap">{t("common.appName")}</span>
          </Link>
          <div className="flex items-center gap-0.5">
            <ThemeToggle />
            <LanguageSwitch className="mr-1" />
            {user.role === "ADMIN" && (
              <Link
                href={admin ? "/events" : "/admin"}
                className="inline-flex h-9 min-w-9 items-center justify-center gap-1.5 rounded-full px-2.5 text-sm font-medium whitespace-nowrap transition hover:bg-muted active:scale-95"
              >
                {admin ? <LayoutGrid className="size-4" /> : <Shield className="size-4" />}
                <span className="sr-only sm:not-sr-only">{admin ? t("nav.memberView") : t("nav.admin")}</span>
              </Link>
            )}
            <form action={logoutAction}>
              <button className="inline-flex size-9 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground active:scale-90" aria-label={t("nav.signOut")}>
                <LogOut className="size-4" />
              </button>
            </form>
          </div>
        </div>
        {admin && (
          <nav className="flex gap-1 overflow-x-auto px-3 pb-2 [scrollbar-width:none]">
            {adminLinks.map((l) => (
              <NavLink key={l.href} href={l.href} exact={l.href === "/admin"} variant="pill">
                {t(l.label)}
              </NavLink>
            ))}
          </nav>
        )}
      </header>

      <main className={admin ? "flex-1 px-4 py-6" : "flex-1 px-4 pt-6 pb-28"}>{children}</main>

      {!admin && (
        <nav className="fixed inset-x-0 bottom-0 z-20 px-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
          <div className="mx-auto grid max-w-sm grid-cols-3 gap-1 rounded-full border border-border/70 bg-card/85 p-1.5 shadow-lg shadow-black/5 backdrop-blur-xl dark:shadow-black/40">
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
