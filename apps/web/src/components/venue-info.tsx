import { CalendarCheck, ChevronDown, ExternalLink, Globe, Info, MapPinned, Phone } from "lucide-react";
import type { Venue } from "@club/db";
import { getT } from "@/lib/i18n/server";
import { cn } from "@/lib/utils";

type VenueDetails = Pick<Venue, "phone" | "website" | "description" | "bookingInfo" | "bookingUrl" | "mapUrl">;

const action =
  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition duration-150 hover:-translate-y-px active:scale-95";

/** Call, website, booking and map buttons for a venue; only the ones it has. */
export async function VenueActions({ venue, className }: { venue: VenueDetails; className?: string }) {
  const { t } = await getT();
  if (!venue.phone && !venue.website && !venue.bookingUrl && !venue.mapUrl) return null;
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {venue.phone && (
        <a href={`tel:${venue.phone.replace(/[^\d+]/g, "")}`} className={cn(action, "border-primary/20 bg-primary text-primary-foreground shadow-sm shadow-primary/25")}>
          <Phone className="size-3.5" aria-hidden />
          <span className="sr-only">{t("courts.call")}: </span>
          {venue.phone}
        </a>
      )}
      {venue.bookingUrl && (
        <a href={venue.bookingUrl} target="_blank" rel="noreferrer" className={cn(action, "border-accent/50 bg-accent text-accent-foreground")}>
          <CalendarCheck className="size-3.5" aria-hidden />
          {t("courts.book")}
        </a>
      )}
      {venue.website && (
        <a href={venue.website} target="_blank" rel="noreferrer" className={cn(action, "border-border bg-card hover:border-primary/40")}>
          <Globe className="size-3.5" aria-hidden />
          {t("courts.website")}
          <ExternalLink className="size-3 opacity-60" aria-hidden />
        </a>
      )}
      {venue.mapUrl && (
        <a href={venue.mapUrl} target="_blank" rel="noreferrer" className={cn(action, "border-border bg-card hover:border-primary/40")}>
          <MapPinned className="size-3.5" aria-hidden />
          {t("courts.map")}
        </a>
      )}
    </div>
  );
}

/** The venue description and how-to-book steps. Collapsed, each shows one line and opens on tap. */
export async function VenueAbout({ venue, collapsed }: { venue: VenueDetails; collapsed?: boolean }) {
  const { t } = await getT();
  if (!venue.description && !venue.bookingInfo) return null;
  const sections = [
    venue.description && { key: "about", icon: Info, title: t("courts.about"), text: venue.description, accent: false },
    venue.bookingInfo && { key: "book", icon: CalendarCheck, title: t("courts.howToBook"), text: venue.bookingInfo, accent: true },
  ].filter((x) => !!x);

  return (
    <div className="grid min-w-0 gap-2 text-sm">
      {sections.map(({ key, icon: Icon, title, text, accent }) => (
        <details
          key={key}
          open={!collapsed}
          className={cn(
            "group min-w-0 rounded-lg border transition-colors [interpolate-size:allow-keywords]",
            "details-content:h-0 details-content:overflow-hidden details-content:transition-all details-content:duration-300 open:details-content:h-auto",
            accent ? "border-accent/40 bg-accent/10 dark:bg-accent/[0.07]" : "border-border bg-muted/40",
          )}
        >
          <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 select-none [&::-webkit-details-marker]:hidden">
            <Icon className="size-4 shrink-0 text-primary" aria-hidden />
            <span className="shrink-0 font-semibold">{title}</span>
            <span className="min-w-0 flex-1 truncate text-muted-foreground group-open:invisible">{text.split("\n")[0]}</span>
            <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform duration-300 group-open:rotate-180" aria-hidden />
          </summary>
          <p className="px-3 pb-3 leading-relaxed whitespace-pre-line text-muted-foreground">{text}</p>
        </details>
      ))}
    </div>
  );
}
