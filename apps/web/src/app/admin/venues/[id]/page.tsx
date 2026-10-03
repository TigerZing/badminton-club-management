import { notFound } from "next/navigation";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardTitle, EmptyState, PageHeader } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { VenueForm } from "@/components/venue-form";
import { VenueInfo } from "@/components/venue-info";
import { getT } from "@/lib/i18n/server";
import { clubToday, formatDateTime, formatDay, formatTimeRange } from "@/lib/time";
import {
  addCourtAction,
  addSlotAction,
  deleteCourtAction,
  deleteSlotAction,
  lookupVenueInfoAction,
  triggerCrawlAction,
} from "@/server/actions/admin";
import { getVenue } from "@/server/services/venues";

// The venue info lookup searches the web and can take a minute or two.
export const maxDuration = 300;

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t("adminVenues.pageTitle") };
}

const slotStatusKey = { AVAILABLE: "adminVenues.slotAvailable", BOOKED: "adminVenues.slotBooked", UNKNOWN: "adminVenues.slotUnknown" } as const;
const slotSourceKey = { CRAWLER: "adminVenues.sourceCrawler", MANUAL: "adminVenues.sourceManual" } as const;

export default async function VenuePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [{ t, locale }, venue] = await Promise.all([getT(), getVenue(id)]);
  if (!venue) notFound();
  const hasInfo = venue.phone || venue.website || venue.description || venue.bookingInfo;

  return (
    <div className="grid gap-5">
      <PageHeader title={venue.name} description={venue.address ?? undefined} />

      <section className="grid gap-2">
        <CardTitle>{t("adminVenues.info")}</CardTitle>
        <Card className="grid gap-3">
          {hasInfo ? (
            <VenueInfo
              venue={venue}
              labels={{ phone: t("adminVenues.phone"), website: t("adminVenues.website"), howToBook: t("adminVenues.howToBook") }}
            />
          ) : (
            <p className="text-sm text-muted-foreground">{t("adminVenues.noInfo")}</p>
          )}
          {venue.infoSources.length > 0 && (
            <details className="text-xs text-muted-foreground">
              <summary className="cursor-pointer">
                {t("adminVenues.sources")} ({venue.infoSources.length})
              </summary>
              <ul className="mt-1 grid gap-0.5">
                {venue.infoSources.map((s) => (
                  <li key={s} className="truncate">
                    <a href={s} target="_blank" rel="noreferrer" className="underline">
                      {s}
                    </a>
                  </li>
                ))}
              </ul>
            </details>
          )}
          <ActionForm action={lookupVenueInfoAction}>
            <input type="hidden" name="venueId" value={venue.id} />
            <p className="text-xs text-muted-foreground">{t("adminVenues.infoHint")}</p>
            <div className="flex flex-wrap items-center gap-2">
              <SubmitButton variant="secondary" pendingText={t("adminVenues.lookingUp")}>
                {venue.infoUpdatedAt ? t("adminVenues.lookupAgain") : t("adminVenues.lookup")}
              </SubmitButton>
              {venue.infoUpdatedAt && (
                <span className="text-xs text-muted-foreground">
                  {t("adminVenues.infoUpdated", { date: formatDateTime(venue.infoUpdatedAt, locale) })}
                </span>
              )}
            </div>
          </ActionForm>
        </Card>
      </section>

      <section className="grid gap-2">
        <CardTitle>{t("adminVenues.courts")}</CardTitle>
        <div className="flex flex-wrap gap-2">
          {venue.courts.map((c) => (
            <ActionForm key={c.id} action={deleteCourtAction} className="flex">
              <input type="hidden" name="venueId" value={venue.id} />
              <input type="hidden" name="courtId" value={c.id} />
              <span className="inline-flex items-center gap-1 rounded-full border border-border bg-card py-1 pr-1 pl-3 text-sm">
                {c.name}
                <SubmitButton size="sm" variant="ghost" className="h-6 px-2" aria-label={t("adminVenues.removeCourt", { name: c.name })} pendingText="…">
                  ×
                </SubmitButton>
              </span>
            </ActionForm>
          ))}
        </div>
        <ActionForm action={addCourtAction} className="grid-cols-[1fr_auto]">
          <input type="hidden" name="venueId" value={venue.id} />
          <Input
            name="name"
            placeholder={t("adminVenues.courtPlaceholder", { number: venue.courts.length + 1 })}
            aria-label={t("adminVenues.courtName")}
            required
          />
          <SubmitButton variant="secondary">{t("adminVenues.addCourt")}</SubmitButton>
        </ActionForm>
      </section>

      <section className="grid gap-2">
        <CardTitle>{t("adminVenues.freeSlots")}</CardTitle>
        {venue.courts.length > 0 ? (
          <Card>
            <ActionForm action={addSlotAction} className="grid-cols-2">
              <input type="hidden" name="venueId" value={venue.id} />
              <Select name="courtId" aria-label={t("adminVenues.court")} className="col-span-2" required>
                {venue.courts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
              <Input name="date" type="date" defaultValue={clubToday()} aria-label={t("adminVenues.date")} required />
              <Input name="price" type="number" min={0} placeholder={t("adminVenues.pricePlaceholder")} aria-label={t("adminVenues.price")} />
              <Input name="startTime" type="time" defaultValue="18:00" aria-label={t("adminVenues.start")} required />
              <Input name="endTime" type="time" defaultValue="20:00" aria-label={t("adminVenues.end")} required />
              <SubmitButton variant="secondary" className="col-span-2 justify-self-start">
                {t("adminVenues.addSlot")}
              </SubmitButton>
            </ActionForm>
          </Card>
        ) : (
          <EmptyState>{t("adminVenues.addCourtsFirst")}</EmptyState>
        )}
        {venue.slots.map((s) => (
          <Card key={s.id} className="flex items-center gap-2 p-2.5 text-sm">
            <span className="flex-1">
              {formatDay(s.startsAt, locale)} · {formatTimeRange(s.startsAt, s.endsAt)} · {s.courtLabel}
            </span>
            <Badge variant={s.status === "AVAILABLE" ? "success" : "muted"}>{t(slotStatusKey[s.status])}</Badge>
            <Badge variant="muted">{t(slotSourceKey[s.source])}</Badge>
            <ActionForm action={deleteSlotAction}>
              <input type="hidden" name="venueId" value={venue.id} />
              <input type="hidden" name="slotId" value={s.id} />
              <SubmitButton size="sm" variant="ghost" pendingText="…">
                {t("common.delete")}
              </SubmitButton>
            </ActionForm>
          </Card>
        ))}
      </section>

      {venue.crawlerKey && (
        <section className="grid gap-2">
          <CardTitle>{t("adminVenues.crawlerSection", { key: venue.crawlerKey })}</CardTitle>
          <ActionForm action={triggerCrawlAction}>
            <input type="hidden" name="venueId" value={venue.id} />
            <SubmitButton variant="secondary" className="justify-self-start" pendingText={t("adminVenues.starting")}>
              {t("adminVenues.runCrawl")}
            </SubmitButton>
          </ActionForm>
          {venue.crawlRuns.length === 0 && <p className="text-sm text-muted-foreground">{t("adminVenues.noCrawls")}</p>}
          {venue.crawlRuns.map((r) => (
            <div key={r.id} className="flex items-center gap-2 text-sm">
              <Badge variant={r.status === "OK" ? "success" : r.status === "FAILED" ? "destructive" : "muted"}>{r.status}</Badge>
              <span>{formatDateTime(r.startedAt, locale)}</span>
              <span className="text-muted-foreground">{r.error ?? t("adminVenues.slotsFound", { count: r.slotsFound })}</span>
            </div>
          ))}
        </section>
      )}

      <section>
        <CardTitle className="mb-2">{t("adminVenues.details")}</CardTitle>
        <Card>
          {/* Remount after a lookup so the fields show the new values. */}
          <VenueForm key={venue.infoUpdatedAt?.toISOString() ?? "none"} venue={venue} />
        </Card>
        <p className="mt-2 text-xs text-muted-foreground">{t("adminVenues.lastChange", { date: formatDateTime(venue.updatedAt, locale) })}</p>
      </section>
    </div>
  );
}
