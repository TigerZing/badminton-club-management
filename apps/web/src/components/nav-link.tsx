"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function NavLink({
  href,
  exact,
  variant,
  children,
}: {
  href: string;
  exact?: boolean;
  variant: "tab" | "pill";
  children: React.ReactNode;
}) {
  const path = usePathname();
  const active = exact ? path === href : path === href || path.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        variant === "tab" && "flex flex-col items-center gap-0.5 py-2 text-xs",
        variant === "tab" && (active ? "text-primary" : "text-muted-foreground"),
        variant === "pill" && "shrink-0 rounded-full px-3 py-1.5 text-sm",
        variant === "pill" && (active ? "bg-primary text-primary-foreground" : "hover:bg-muted"),
      )}
    >
      {children}
    </Link>
  );
}
