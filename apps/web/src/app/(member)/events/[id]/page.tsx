import { notFound } from "next/navigation";
import { Clock, MapPin, Users } from "lucide-react";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { Card, CardTitle, EmptyState } from "@/components/ui/card";
import { EventStatusBadge, MyStatusBadge, SkillDot } from "@/components/event-bits";
import { MatchCard, RoundHeader } from "@/components/round-view";
import { getT } from "@/lib/i18n/server";
import { formatDateTime, formatDay, formatTimeRange } from "@/lib/time";
import { cancelRegistrationAction, registerForEventAction } from "@/server/actions/account";
import { requireUser } from "@/server/session";
import { getEventWithRegistrations } from "@/server/services/events";
import { listRounds } from "@/server/services/matches";
import { isRegistrationOpen } from "@/server/services/registrations";

export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const { t, locale } = await getT();
  const event = await getEventWithRegistrations(id);
  if (!event || event.status === "DRAFT") notFound();
  const rounds = await listRounds(id, { includeDrafts: false });

  const confirmed = event.registrations.filter((r) => r.status === "CONFIRMED");
  const waitlist = event.registrations.filter((r) => r.status === "WAITLISTED");
  const mine = event.registrations.find((r) => r.userId === user.id);
  const open = isRegistrationOpen(event);

  return (
    <div className="grid gap-4">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-semibold">{event.title}</h1>
          <EventStatusBadge status={event.status} />
        </div>
        <div className="mt-2 grid gap-1 text-sm text-muted-foreground">
          <p className="flex items-center gap-1.5">
            <Clock className="size-4" /> {formatDay(event.startsAt, locale)} · {formatTimeRange(event.startsAt, event.endsAt)}
          </p>
          {event.venue && (
            <p className="flex items-center gap-1.5">
              <MapPin className="size-4" />
              {event.venue.mapUrl ? (
                <a href={event.venue.mapUrl} className="underline" target="_blank" rel="noreferrer">
                  {event.venue.name}
                </a>
              ) : (
                event.venue.name
              )}
            </p>
          )}
          <p className="flex items-center gap-1.5">
            <Users className="size-4" /> {t("events.playersAndCourts", { confirmed: confirmed.length, max: event.maxPlayers, courts: event.courtCount })}
          </p>
        </div>
        {event.notes && <p className="mt-2 whitespace-pre-line text-sm">{event.notes}</p>}
      </div>

      <Card>
        <div className="flex items-center justify-between gap-3">
          <div>
            <MyStatusBadge status={mine?.status ?? null} />
            <p className="mt-1 text-sm text-muted-foreground">
              {open ? t("events.closesAt", { date: formatDateTime(event.registrationDeadline, locale) }) : t("events.registrationClosed")}
              {mine?.status === "WAITLISTED" &&
                ` ${t("events.waitlistPosition", { position: waitlist.findIndex((r) => r.userId === user.id) + 1 })}`}
            </p>
          </div>
          {open && (
            <ActionForm action={mine ? cancelRegistrationAction : registerForEventAction} className="shrink-0 justify-items-end">
              <input type="hidden" name="eventId" value={event.id} />
              {mine ? (
                <SubmitButton variant="outline" pendingText={t("events.cancelling")}>
                  {t("common.cancel")}
                </SubmitButton>
              ) : (
                <SubmitButton pendingText={t("events.joining")}>
                  {confirmed.length >= event.maxPlayers ? t("events.joinWaitlist") : t("events.register")}
                </SubmitButton>
              )}
            </ActionForm>
          )}
        </div>
      </Card>

      {rounds.length > 0 && (
        <section className="grid gap-4">
          <h2 className="text-lg font-semibold">{t("events.matches")}</h2>
          {rounds.map((round) => (
            <div key={round.id}>
              <RoundHeader round={round} />
              <div className="grid gap-2 sm:grid-cols-2">
                {round.matches.map((m) => (
                  <MatchCard key={m.id} match={m} highlight={user.id} />
                ))}
              </div>
            </div>
          ))}
        </section>
      )}

      <section>
        <CardTitle className="mb-2">{t("events.players", { count: confirmed.length })}</CardTitle>
        {confirmed.length === 0 ? (
          <EmptyState>{t("events.noPlayers")}</EmptyState>
        ) : (
          <ul className="grid gap-1 sm:grid-cols-2">
            {confirmed.map((r) => (
              <li key={r.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm odd:bg-muted/50">
                <SkillDot level={r.user.skillLevel} />
                <span className={r.userId === user.id ? "font-semibold" : undefined}>{r.user.name}</span>
              </li>
            ))}
          </ul>
        )}
        {waitlist.length > 0 && (
          <>
            <CardTitle className="mt-4 mb-2">{t("events.waitlist", { count: waitlist.length })}</CardTitle>
            <ol className="grid gap-1 text-sm">
              {waitlist.map((r, i) => (
                <li key={r.id} className="px-2 text-muted-foreground">
                  {i + 1}. {r.user.name}
                </li>
              ))}
            </ol>
          </>
        )}
      </section>
    </div>
  );
}
