"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

/** Switches between light and dark; the choice is remembered on this device. */
export function ThemeToggle({ className }: { className?: string }) {
  const t = useT();
  const [dark, setDark] = useState<boolean | null>(null);

  useEffect(() => setDark(document.documentElement.classList.contains("dark")), []);

  function toggle() {
    const root = document.documentElement;
    const next = !root.classList.contains("dark");
    root.classList.add("theme-transition");
    root.classList.toggle("dark", next);
    window.setTimeout(() => root.classList.remove("theme-transition"), 350);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {}
    setDark(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? t("common.lightMode") : t("common.darkMode")}
      className={cn(
        "relative inline-flex size-9 items-center justify-center overflow-hidden rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground active:scale-90",
        className,
      )}
    >
      <Sun className="size-[18px] transition-all duration-300 dark:-rotate-90 dark:scale-0 dark:opacity-0" />
      <Moon className="absolute size-[18px] rotate-90 scale-0 opacity-0 transition-all duration-300 dark:rotate-0 dark:scale-100 dark:opacity-100" />
    </button>
  );
}
