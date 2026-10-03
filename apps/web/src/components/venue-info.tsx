import { CalendarCheck, ExternalLink, Globe, MapPinned, Phone } from "lucide-react";
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

/** The venue description and how-to-book steps. */
export async function VenueAbout({ venue }: { venue: VenueDetails }) {
  const { t } = await getT();
  if (!venue.description && !venue.bookingInfo) return null;
  return (
    <div className="grid gap-3 text-sm">
      {venue.description && <p className="leading-relaxed whitespace-pre-line text-foreground/85">{venue.description}</p>}
      {venue.bookingInfo && (
        <div className="rounded-lg border-l-[3px] border-accent bg-accent/10 py-2.5 pr-3 pl-3 dark:bg-accent/[0.07]">
          <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-foreground uppercase">
            <CalendarCheck className="size-3.5 text-primary" aria-hidden />
            {t("courts.howToBook")}
          </p>
          <p className="leading-relaxed whitespace-pre-line text-muted-foreground">{venue.bookingInfo}</p>
        </div>
      )}
    </div>
  );
}
