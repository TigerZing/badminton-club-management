"use client";

import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n/client";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useT();
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col items-center justify-center gap-3 px-4 text-center">
      <div className="text-4xl">🏸</div>
      <h1 className="text-xl font-semibold">{t("common.somethingWentWrong")}</h1>
      <p className="text-sm text-muted-foreground">
        {t("common.errorHint")}
        {error.digest ? ` (${error.digest})` : ""}
      </p>
      <Button onClick={reset}>{t("common.tryAgain")}</Button>
    </main>
  );
}
