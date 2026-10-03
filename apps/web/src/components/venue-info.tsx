import { ExternalLink, Phone } from "lucide-react";
import type { Venue } from "@club/db";

/** Phone, website, description and booking steps of a venue, for admins and members. */
export function VenueInfo({
  venue,
  labels,
}: {
  venue: Pick<Venue, "phone" | "website" | "description" | "bookingInfo">;
  labels: { phone: string; website: string; howToBook: string };
}) {
  return (
    <div className="grid gap-2 text-sm">
      {(venue.phone || venue.website) && (
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {venue.phone && (
            <a href={`tel:${venue.phone.replace(/[^\d+]/g, "")}`} className="inline-flex items-center gap-1 font-medium text-primary">
              <Phone className="size-3.5" aria-hidden /> <span className="sr-only">{labels.phone}: </span>
              {venue.phone}
            </a>
          )}
          {venue.website && (
            <a href={venue.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-medium text-primary">
              {labels.website} <ExternalLink className="size-3.5" aria-hidden />
            </a>
          )}
        </div>
      )}
      {venue.description && <p className="whitespace-pre-line">{venue.description}</p>}
      {venue.bookingInfo && (
        <div>
          <p className="font-medium">{labels.howToBook}</p>
          <p className="whitespace-pre-line text-muted-foreground">{venue.bookingInfo}</p>
        </div>
      )}
    </div>
  );
}
