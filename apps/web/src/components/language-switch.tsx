"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useT } from "@/lib/i18n/client";
import { locales } from "@/lib/i18n/config";
import { setLocaleAction } from "@/server/actions/locale";
import { cn } from "@/lib/utils";

/** Two small buttons, VI and EN; the page re-renders in the chosen language. */
export function LanguageSwitch({ className }: { className?: string }) {
  const current = useLocale();
  const t = useT();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div role="group" aria-label={t("common.language")} className={cn("inline-flex rounded-lg border border-border p-0.5 text-xs", className)}>
      {locales.map((l) => (
        <button
          key={l}
          type="button"
          disabled={pending}
          aria-pressed={l === current}
          onClick={() =>
            startTransition(async () => {
              await setLocaleAction(l);
              router.refresh();
            })
          }
          className={cn(
            "rounded-md px-2 py-1 font-medium uppercase",
            l === current ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
          )}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
