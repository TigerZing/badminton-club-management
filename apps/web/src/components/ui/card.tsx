import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({ className, interactive, ...props }: React.HTMLAttributes<HTMLDivElement> & { interactive?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border/80 bg-card p-4 shadow-sm shadow-black/[0.03] dark:shadow-black/20",
        interactive &&
          "transition duration-200 ease-out hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md hover:shadow-primary/10 active:translate-y-0 active:scale-[0.99]",
        className,
      )}
      {...props}
    />
  );
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("font-semibold leading-tight tracking-tight", className)} {...props} />;
}

export function PageHeader({ title, description, action }: { title: string; description?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-5 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border bg-card/50 px-6 py-8 text-center text-sm text-muted-foreground">
      <span className="text-2xl opacity-60" aria-hidden>
        🏸
      </span>
      {children}
    </div>
  );
}

/** Grey placeholder blocks shown while a page loads. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-shimmer rounded-lg bg-muted", className)} />;
}
