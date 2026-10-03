import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle, EmptyState, PageHeader } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { VenueInfo } from "@/components/venue-info";
import { getT } from "@/lib/i18n/server";
import { clubToday, formatDateTime, formatTimeRange } from "@/lib/time";
import { getAvailability, listVenues } from "@/server/services/venues";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t("nav.courts") };
}

export default async function CourtsPage({ searchParams }: { searchParams: Promise<{ date?: string; venue?: string }> }) {
  const sp = await searchParams;
  const date = /^\d{4}-\d{2}-\d{2}$/.test(sp.date ?? "") ? sp.date! : clubToday();
  const [{ t, locale }, venues, availability] = await Promise.all([
    getT(),
    listVenues({ activeOnly: true }),
    getAvailability(date, sp.venue || undefined),
  ]);

  return (
    <>
      <PageHeader title={t("courts.title")} description={t("courts.description")} />
      <form className="mb-4 grid grid-cols-[1fr_1fr_auto] gap-2">
        <Input type="date" name="date" defaultValue={date} aria-label={t("courts.date")} />
        <Select name="venue" defaultValue={sp.venue ?? ""} aria-label={t("courts.venue")}>
          <option value="">{t("courts.allVenues")}</option>
          {venues.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </Select>
        <Button type="submit" variant="secondary">
          {t("common.show")}
        </Button>
      </form>

      {availability.length === 0 && <EmptyState>{t("courts.noVenues")}</EmptyState>}
      <div className="grid gap-3">
        {availability.map((v) => {
          const byCourt = new Map<string, typeof v.slots>();
          for (const s of v.slots) byCourt.set(s.courtLabel, [...(byCourt.get(s.courtLabel) ?? []), s]);
          return (
            <Card key={v.id}>
              <div className="mb-2 flex items-start justify-between gap-2">
                <div>
                  <CardTitle>{v.name}</CardTitle>
                  {v.address && <p className="text-sm text-muted-foreground">{v.address}</p>}
                </div>
                {v.bookingUrl && (
                  <a
                    href={v.bookingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary"
                  >
                    {t("courts.book")} <ExternalLink className="size-3.5" />
                  </a>
                )}
              </div>
              {v.slots.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("courts.noSlots")}</p>
              ) : (
                <div className="grid gap-2">
                  {[...byCourt.entries()].map(([court, slots]) => (
                    <div key={court}>
                      <p className="text-xs font-medium text-muted-foreground">{court}</p>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {slots.map((s) => (
                          <span key={s.id} className="rounded-md bg-success/10 px-2 py-1 text-xs font-medium text-success">
                            {formatTimeRange(s.startsAt, s.endsAt)}
                            {s.price ? ` · ${s.price.toLocaleString("vi-VN")}₫` : ""}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {(v.phone || v.website || v.description || v.bookingInfo) && (
                <details className="mt-3 rounded-lg border border-border px-3 py-2">
                  <summary className="cursor-pointer text-sm font-medium">{t("courts.aboutVenue")}</summary>
                  <div className="mt-2">
                    <VenueInfo venue={v} labels={{ phone: t("courts.call"), website: t("courts.website"), howToBook: t("courts.howToBook") }} />
                  </div>
                </details>
              )}
              <p className="mt-3 text-xs text-muted-foreground">
                {v.lastUpdated ? t("courts.updated", { date: formatDateTime(v.lastUpdated, locale) }) : t("courts.notUpdated")}
              </p>
            </Card>
          );
        })}
      </div>
    </>
  );
}
