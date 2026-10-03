import { Clock, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle, EmptyState, PageHeader } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { VenueAbout, VenueActions } from "@/components/venue-info";
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
      <form className="mb-5 grid grid-cols-[1fr_1fr_auto] gap-2 rounded-xl border border-border/80 bg-card/70 p-2 shadow-sm backdrop-blur">
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
      <div className="stagger grid gap-4">
        {availability.map((v) => {
          const byCourt = new Map<string, typeof v.slots>();
          for (const s of v.slots) byCourt.set(s.courtLabel, [...(byCourt.get(s.courtLabel) ?? []), s]);
          return (
            <Card key={v.id} className="overflow-hidden p-0">
              <div className="relative bg-gradient-to-br from-primary/15 via-primary/5 to-accent/15 px-4 pt-4 pb-3">
                <div className="flex items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-card text-primary shadow-sm">
                    <MapPin className="size-5" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <CardTitle className="text-base">{v.name}</CardTitle>
                    {v.address && <p className="mt-0.5 text-sm text-muted-foreground">{v.address}</p>}
                  </div>
                </div>
                <VenueActions venue={v} className="mt-3" />
              </div>

              <div className="grid gap-4 p-4">
                <VenueAbout venue={v} />

                <div>
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    <Clock className="size-3.5" aria-hidden />
                    {t("courts.freeSlots")}
                  </p>
                  {v.slots.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t("courts.noSlots")}</p>
                  ) : (
                    <div className="grid gap-2">
                      {[...byCourt.entries()].map(([court, slots]) => (
                        <div key={court} className="flex flex-wrap items-center gap-1.5">
                          <span className="mr-1 w-16 shrink-0 text-xs font-medium text-muted-foreground">{court}</span>
                          {slots.map((s) => (
                            <span
                              key={s.id}
                              className="rounded-full bg-success/12 px-2.5 py-1 text-xs font-semibold text-success ring-1 ring-success/20 ring-inset"
                            >
                              {formatTimeRange(s.startsAt, s.endsAt)}
                              {s.price ? ` · ${s.price.toLocaleString("vi-VN")}₫` : ""}
                            </span>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <p className="text-xs text-muted-foreground/80">
                  {v.lastUpdated ? t("courts.updated", { date: formatDateTime(v.lastUpdated, locale) }) : t("courts.notUpdated")}
                </p>
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}
