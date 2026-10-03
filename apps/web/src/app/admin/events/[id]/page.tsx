import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma, type EventStatus } from "@club/db";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardTitle, EmptyState } from "@/components/ui/card";
import { Select } from "@/components/ui/input";
import { EventStatusBadge, SkillDot } from "@/components/event-bits";
import { formatDateTime, formatDay, formatTimeRange } from "@/lib/time";
import {
  adminAddRegistrationAction,
  adminConfirmRegistrationAction,
  adminRemoveRegistrationAction,
  setCheckInAction,
  setEventStatusAction,
} from "@/server/actions/admin";
import { allowedTransitions, getEventWithRegistrations } from "@/server/services/events";

const STATUS_ACTION: Record<EventStatus, string> = {
  DRAFT: "Back to draft",
  OPEN: "Open registration",
  CLOSED: "Close registration",
  IN_PROGRESS: "Start session",
  COMPLETED: "Mark completed",
  CANCELLED: "Cancel event",
};

export default async function AdminEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await getEventWithRegistrations(id);
  if (!event) notFound();

  const registeredIds = new Set(event.registrations.map((r) => r.userId));
  const others = await prisma.user.findMany({
    where: { isActive: true, id: { notIn: [...registeredIds] } },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
  const confirmed = event.registrations.filter((r) => r.status === "CONFIRMED");
  const waitlist = event.registrations.filter((r) => r.status === "WAITLISTED");
  const checkedIn = confirmed.filter((r) => r.checkedInAt).length;

  return (
    <div className="grid gap-5">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-semibold">{event.title}</h1>
          <EventStatusBadge status={event.status} />
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {formatDay(event.startsAt)} · {formatTimeRange(event.startsAt, event.endsAt)}
          {event.venue ? ` · ${event.venue.name}` : ""} · {event.courtCount} courts
        </p>
        <p className="text-sm text-muted-foreground">Registration closes {formatDateTime(event.registrationDeadline)}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href={`/admin/events/${event.id}/matches`} className={buttonVariants()}>
            Match board
          </Link>
          <Link href={`/admin/events/${event.id}/edit`} className={buttonVariants({ variant: "outline" })}>
            Edit
          </Link>
          {allowedTransitions(event.status).map((s) => (
            <ActionForm key={s} action={setEventStatusAction}>
              <input type="hidden" name="eventId" value={event.id} />
              <input type="hidden" name="status" value={s} />
              <SubmitButton variant={s === "CANCELLED" ? "destructive" : "secondary"}>{STATUS_ACTION[s]}</SubmitButton>
            </ActionForm>
          ))}
        </div>
      </div>

      <section className="grid gap-2">
        <div className="flex items-baseline justify-between">
          <CardTitle>
            Players {confirmed.length}/{event.maxPlayers}
          </CardTitle>
          <span className="text-sm text-muted-foreground">{checkedIn} checked in</span>
        </div>
        {confirmed.length === 0 && <EmptyState>No confirmed players yet.</EmptyState>}
        {confirmed.map((r) => (
          <Card key={r.id} className="flex items-center gap-2 p-2.5">
            <SkillDot level={r.user.skillLevel} />
            <span className="min-w-0 flex-1 truncate text-sm font-medium">{r.user.name}</span>
            <ActionForm action={setCheckInAction}>
              <input type="hidden" name="eventId" value={event.id} />
              <input type="hidden" name="registrationId" value={r.id} />
              <input type="hidden" name="checkedIn" value={r.checkedInAt ? "" : "1"} />
              <SubmitButton size="sm" variant={r.checkedInAt ? "default" : "outline"} pendingText="…">
                {r.checkedInAt ? "Checked in" : "Check in"}
              </SubmitButton>
            </ActionForm>
            <ActionForm action={adminRemoveRegistrationAction}>
              <input type="hidden" name="eventId" value={event.id} />
              <input type="hidden" name="registrationId" value={r.id} />
              <SubmitButton size="sm" variant="ghost" pendingText="…">
                Remove
              </SubmitButton>
            </ActionForm>
          </Card>
        ))}
      </section>

      {waitlist.length > 0 && (
        <section className="grid gap-2">
          <CardTitle>Waitlist</CardTitle>
          {waitlist.map((r, i) => (
            <Card key={r.id} className="flex items-center gap-2 p-2.5">
              <Badge variant="warning">#{i + 1}</Badge>
              <span className="min-w-0 flex-1 truncate text-sm">{r.user.name}</span>
              <ActionForm action={adminConfirmRegistrationAction}>
                <input type="hidden" name="eventId" value={event.id} />
                <input type="hidden" name="registrationId" value={r.id} />
                <SubmitButton size="sm" variant="secondary" pendingText="…">
                  Confirm
                </SubmitButton>
              </ActionForm>
              <ActionForm action={adminRemoveRegistrationAction}>
                <input type="hidden" name="eventId" value={event.id} />
                <input type="hidden" name="registrationId" value={r.id} />
                <SubmitButton size="sm" variant="ghost" pendingText="…">
                  Remove
                </SubmitButton>
              </ActionForm>
            </Card>
          ))}
        </section>
      )}

      <section>
        <CardTitle className="mb-2">Add a member</CardTitle>
        <ActionForm action={adminAddRegistrationAction} className="grid-cols-[1fr_auto]">
          <input type="hidden" name="eventId" value={event.id} />
          <Select name="userId" defaultValue="" aria-label="Member">
            <option value="" disabled>
              Pick a member
            </option>
            {others.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </Select>
          <SubmitButton variant="secondary">Add</SubmitButton>
        </ActionForm>
        <p className="mt-1 text-xs text-muted-foreground">Admins can add players after the deadline or above the limit.</p>
      </section>
    </div>
  );
}
