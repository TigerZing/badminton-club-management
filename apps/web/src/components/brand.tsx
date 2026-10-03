import { cn } from "@/lib/utils";

/** The club mark: a shuttlecock in a rounded green tile. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-emerald-700 text-primary-foreground shadow-sm shadow-primary/30 dark:to-emerald-500",
        className,
      )}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" className="size-[60%]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 4.5 12 3l5 1.5-2.2 9.3H9.2z" />
        <path d="M9.6 4.1 10.6 13.8M14.4 4.1l-1 9.7M12 3v10.8" opacity=".55" />
        <circle cx="12" cy="17.5" r="3.5" fill="currentColor" stroke="none" />
      </svg>
    </span>
  );
}
