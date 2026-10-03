import { notFound } from "next/navigation";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardTitle, EmptyState, PageHeader } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { VenueForm } from "@/components/venue-form";
import { clubToday, formatDateTime, formatDay, formatTimeRange } from "@/lib/time";
import { addCourtAction, addSlotAction, deleteCourtAction, deleteSlotAction, triggerCrawlAction } from "@/server/actions/admin";
import { getVenue } from "@/server/services/venues";

export const metadata = { title: "Venue" };

export default async function VenuePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const venue = await getVenue(id);
  if (!venue) notFound();

  return (
    <div className="grid gap-5">
      <PageHeader title={venue.name} description={venue.address ?? undefined} />

      <section className="grid gap-2">
        <CardTitle>Courts</CardTitle>
        <div className="flex flex-wrap gap-2">
          {venue.courts.map((c) => (
            <ActionForm key={c.id} action={deleteCourtAction} className="flex">
              <input type="hidden" name="venueId" value={venue.id} />
              <input type="hidden" name="courtId" value={c.id} />
              <span className="inline-flex items-center gap-1 rounded-full border border-border bg-card py-1 pr-1 pl-3 text-sm">
                {c.name}
                <SubmitButton size="sm" variant="ghost" className="h-6 px-2" aria-label={`Remove ${c.name}`} pendingText="…">
                  ×
                </SubmitButton>
              </span>
            </ActionForm>
          ))}
        </div>
        <ActionForm action={addCourtAction} className="grid-cols-[1fr_auto]">
          <input type="hidden" name="venueId" value={venue.id} />
          <Input name="name" placeholder={`Court ${venue.courts.length + 1}`} aria-label="Court name" required />
          <SubmitButton variant="secondary">Add court</SubmitButton>
        </ActionForm>
      </section>

      <section className="grid gap-2">
        <CardTitle>Free slots</CardTitle>
        {venue.courts.length > 0 ? (
          <Card>
            <ActionForm action={addSlotAction} className="grid-cols-2">
              <input type="hidden" name="venueId" value={venue.id} />
              <Select name="courtId" aria-label="Court" className="col-span-2" required>
                {venue.courts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
              <Input name="date" type="date" defaultValue={clubToday()} aria-label="Date" required />
              <Input name="price" type="number" min={0} placeholder="Price (₫, optional)" aria-label="Price" />
              <Input name="startTime" type="time" defaultValue="18:00" aria-label="Start" required />
              <Input name="endTime" type="time" defaultValue="20:00" aria-label="End" required />
              <SubmitButton variant="secondary" className="col-span-2 justify-self-start">
                Add free slot
              </SubmitButton>
            </ActionForm>
          </Card>
        ) : (
          <EmptyState>Add courts first to enter slots by hand.</EmptyState>
        )}
        {venue.slots.map((s) => (
          <Card key={s.id} className="flex items-center gap-2 p-2.5 text-sm">
            <span className="flex-1">
              {formatDay(s.startsAt)} · {formatTimeRange(s.startsAt, s.endsAt)} · {s.courtLabel}
            </span>
            <Badge variant={s.status === "AVAILABLE" ? "success" : "muted"}>{s.status.toLowerCase()}</Badge>
            <Badge variant="muted">{s.source.toLowerCase()}</Badge>
            <ActionForm action={deleteSlotAction}>
              <input type="hidden" name="venueId" value={venue.id} />
              <input type="hidden" name="slotId" value={s.id} />
              <SubmitButton size="sm" variant="ghost" pendingText="…">
                Delete
              </SubmitButton>
            </ActionForm>
          </Card>
        ))}
      </section>

      {venue.crawlerKey && (
        <section className="grid gap-2">
          <CardTitle>Crawler ({venue.crawlerKey})</CardTitle>
          <ActionForm action={triggerCrawlAction}>
            <input type="hidden" name="venueId" value={venue.id} />
            <SubmitButton variant="secondary" className="justify-self-start" pendingText="Starting…">
              Run crawl now
            </SubmitButton>
          </ActionForm>
          {venue.crawlRuns.length === 0 && <p className="text-sm text-muted-foreground">No crawls yet.</p>}
          {venue.crawlRuns.map((r) => (
            <div key={r.id} className="flex items-center gap-2 text-sm">
              <Badge variant={r.status === "OK" ? "success" : r.status === "FAILED" ? "destructive" : "muted"}>{r.status}</Badge>
              <span>{formatDateTime(r.startedAt)}</span>
              <span className="text-muted-foreground">{r.error ?? `${r.slotsFound} slots`}</span>
            </div>
          ))}
        </section>
      )}

      <section>
        <CardTitle className="mb-2">Details</CardTitle>
        <Card>
          <VenueForm venue={venue} />
        </Card>
        <p className="mt-2 text-xs text-muted-foreground">Last change {formatDateTime(venue.updatedAt)}</p>
      </section>
    </div>
  );
}
