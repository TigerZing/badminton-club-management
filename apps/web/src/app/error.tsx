"use client";

import { Button } from "@/components/ui/button";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col items-center justify-center gap-3 px-4 text-center">
      <div className="text-4xl">🏸</div>
      <h1 className="text-xl font-semibold">Something went wrong</h1>
      <p className="text-sm text-muted-foreground">
        Please try again. If it keeps happening, tell a club admin{error.digest ? ` (code ${error.digest})` : ""}.
      </p>
      <Button onClick={reset}>Try again</Button>
    </main>
  );
}
