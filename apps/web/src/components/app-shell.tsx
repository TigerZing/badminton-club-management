import Link from "next/link";
import { CalendarDays, LayoutGrid, LogOut, MapPin, Shield, User } from "lucide-react";
import type { User as DbUser } from "@club/db";
import { logoutAction } from "@/server/actions/auth";
import { NavLink } from "./nav-link";

const memberTabs = [
  { href: "/events", label: "Events", icon: CalendarDays },
  { href: "/courts", label: "Courts", icon: MapPin },
  { href: "/me", label: "Me", icon: User },
];

const adminLinks = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/events", label: "Events" },
  { href: "/admin/members", label: "Members" },
  { href: "/admin/venues", label: "Venues" },
];

export function AppShell({ user, admin, children }: { user: DbUser; admin?: boolean; children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-3xl flex-col">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
        <div className="flex h-14 items-center justify-between px-4">
          <Link href="/events" className="font-semibold">
            🏸 Badminton Club
          </Link>
          <div className="flex items-center gap-1">
            {user.role === "ADMIN" && (
              <Link
                href={admin ? "/events" : "/admin"}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm hover:bg-muted"
              >
                {admin ? <LayoutGrid className="size-4" /> : <Shield className="size-4" />}
                {admin ? "Member view" : "Admin"}
              </Link>
            )}
            <form action={logoutAction}>
              <button className="inline-flex size-9 items-center justify-center rounded-lg hover:bg-muted" aria-label="Sign out">
                <LogOut className="size-4" />
              </button>
            </form>
          </div>
        </div>
        {admin && (
          <nav className="flex gap-1 overflow-x-auto px-4 pb-2">
            {adminLinks.map((l) => (
              <NavLink key={l.href} href={l.href} exact={l.href === "/admin"} variant="pill">
                {l.label}
              </NavLink>
            ))}
          </nav>
        )}
      </header>

      <main className={admin ? "flex-1 px-4 py-5" : "flex-1 px-4 pt-5 pb-24"}>{children}</main>

      {!admin && (
        <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-card pb-[env(safe-area-inset-bottom)]">
          <div className="mx-auto grid max-w-3xl grid-cols-3">
            {memberTabs.map((t) => (
              <NavLink key={t.href} href={t.href} variant="tab">
                <t.icon className="size-5" />
                <span>{t.label}</span>
              </NavLink>
            ))}
          </div>
        </nav>
      )}
    </div>
  );
}
