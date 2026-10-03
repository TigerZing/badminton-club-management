import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@club/db";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardTitle, EmptyState } from "@/components/ui/card";
import { Select } from "@/components/ui/input";
import { EventStatusBadge, SkillDot } from "@/components/event-bits";
import { getT } from "@/lib/i18n/server";
import { formatDateTime, formatDay, formatTimeRange } from "@/lib/time";
import {
  adminAddRegistrationAction,
  adminConfirmRegistrationAction,
  adminRemoveRegistrationAction,
  setCheckInAction,
  setEventStatusAction,
} from "@/server/actions/admin";
import { allowedTransitions, getEventWithRegistrations } from "@/server/services/events";

export default async function AdminEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [{ t, locale }, event] = await Promise.all([getT(), getEventWithRegistrations(id)]);
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
          {formatDay(event.startsAt, locale)} · {formatTimeRange(event.startsAt, event.endsAt)}
          {event.venue ? ` · ${event.venue.name}` : ""} · {t("adminEvents.courtCount", { count: event.courtCount })}
        </p>
        <p className="text-sm text-muted-foreground">
          {t("adminEvents.closesAt", {
            date: formatDateTime(event.registrationDeadline, locale),
          })}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href={`/admin/events/${event.id}/matches`} className={buttonVariants()}>
            {t("adminEvents.matchBoard")}
          </Link>
          <Link href={`/admin/events/${event.id}/edit`} className={buttonVariants({ variant: "outline" })}>
            {t("common.edit")}
          </Link>
          {allowedTransitions(event.status).map((s) => (
            <ActionForm key={s} action={setEventStatusAction}>
              <input type="hidden" name="eventId" value={event.id} />
              <input type="hidden" name="status" value={s} />
              <SubmitButton variant={s === "CANCELLED" ? "destructive" : "secondary"}>
                {t(`adminEvents.statusAction.${s}`)}
              </SubmitButton>
            </ActionForm>
          ))}
        </div>
      </div>

      <section className="grid gap-2">
        <div className="flex items-baseline justify-between">
          <CardTitle>
            {t("adminEvents.players", {
              count: confirmed.length,
              max: event.maxPlayers,
            })}
          </CardTitle>
          <span className="text-sm text-muted-foreground">{t("adminEvents.checkedInCount", { count: checkedIn })}</span>
        </div>
        {confirmed.length === 0 && <EmptyState>{t("adminEvents.noConfirmed")}</EmptyState>}
        {confirmed.map((r) => (
          <Card key={r.id} className="flex items-center gap-2 p-2.5">
            <SkillDot level={r.user.skillLevel} />
            <span className="min-w-0 flex-1 truncate text-sm font-medium">{r.user.name}</span>
            <ActionForm action={setCheckInAction}>
              <input type="hidden" name="eventId" value={event.id} />
              <input type="hidden" name="registrationId" value={r.id} />
              <input type="hidden" name="checkedIn" value={r.checkedInAt ? "" : "1"} />
              <SubmitButton size="sm" variant={r.checkedInAt ? "default" : "outline"} pendingText="…">
                {r.checkedInAt ? t("adminEvents.checkedIn") : t("adminEvents.checkIn")}
              </SubmitButton>
            </ActionForm>
            <ActionForm action={adminRemoveRegistrationAction}>
              <input type="hidden" name="eventId" value={event.id} />
              <input type="hidden" name="registrationId" value={r.id} />
              <SubmitButton size="sm" variant="ghost" pendingText="…">
                {t("adminEvents.remove")}
              </SubmitButton>
            </ActionForm>
          </Card>
        ))}
      </section>

      {waitlist.length > 0 && (
        <section className="grid gap-2">
          <CardTitle>{t("adminEvents.waitlist")}</CardTitle>
          {waitlist.map((r, i) => (
            <Card key={r.id} className="flex items-center gap-2 p-2.5">
              <Badge variant="warning">#{i + 1}</Badge>
              <span className="min-w-0 flex-1 truncate text-sm">{r.user.name}</span>
              <ActionForm action={adminConfirmRegistrationAction}>
                <input type="hidden" name="eventId" value={event.id} />
                <input type="hidden" name="registrationId" value={r.id} />
                <SubmitButton size="sm" variant="secondary" pendingText="…">
                  {t("adminEvents.confirm")}
                </SubmitButton>
              </ActionForm>
              <ActionForm action={adminRemoveRegistrationAction}>
                <input type="hidden" name="eventId" value={event.id} />
                <input type="hidden" name="registrationId" value={r.id} />
                <SubmitButton size="sm" variant="ghost" pendingText="…">
                  {t("adminEvents.remove")}
                </SubmitButton>
              </ActionForm>
            </Card>
          ))}
        </section>
      )}

      <section>
        <CardTitle className="mb-2">{t("adminEvents.addMember")}</CardTitle>
        <ActionForm action={adminAddRegistrationAction} className="grid-cols-[1fr_auto]">
          <input type="hidden" name="eventId" value={event.id} />
          <Select name="userId" defaultValue="" aria-label={t("adminEvents.member")}>
            <option value="" disabled>
              {t("adminEvents.pickMember")}
            </option>
            {others.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </Select>
          <SubmitButton variant="secondary">{t("adminEvents.add")}</SubmitButton>
        </ActionForm>
        <p className="mt-1 text-xs text-muted-foreground">{t("adminEvents.addHint")}</p>
      </section>
    </div>
  );
}
