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
        "transition duration-200 ease-out active:scale-95",
        variant === "tab" && "flex flex-col items-center gap-0.5 rounded-full py-1.5 text-[11px] font-medium",
        variant === "tab" && (active ? "bg-primary text-primary-foreground shadow-sm shadow-primary/30" : "text-muted-foreground hover:text-foreground"),
        variant === "pill" && "shrink-0 rounded-full px-3 py-1.5 text-sm font-medium",
        variant === "pill" && (active ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25" : "text-muted-foreground hover:bg-muted hover:text-foreground"),
      )}
    >
      {children}
    </Link>
  );
}
