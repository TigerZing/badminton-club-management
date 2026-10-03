import Link from "next/link";
import { ChevronRight, MapPin } from "lucide-react";
import { Card, EmptyState, PageHeader } from "@/components/ui/card";
import { EventStatusBadge, MyStatusBadge } from "@/components/event-bits";
import { intlLocale, type Locale } from "@/lib/i18n/config";
import { getT } from "@/lib/i18n/server";
import { CLUB_TIME_ZONE, formatDay, formatTimeRange } from "@/lib/time";
import { requireUser } from "@/server/session";
import { listUpcomingEvents } from "@/server/services/events";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t("events.title") };
}

/** Weekday and day of month for the date chip, e.g. "Sat" / "10" or "Th 7" / "10". */
function dateChip(d: Date, locale: Locale) {
  const parts = new Intl.DateTimeFormat(intlLocale[locale], { timeZone: CLUB_TIME_ZONE, weekday: "short", day: "numeric" }).formatToParts(d);
  return { weekday: parts.find((p) => p.type === "weekday")?.value ?? "", day: parts.find((p) => p.type === "day")?.value ?? "" };
}

export default async function EventsPage() {
  const user = await requireUser();
  const [{ t, locale }, events] = await Promise.all([getT(), listUpcomingEvents(user.id)]);

  return (
    <>
      <PageHeader title={t("events.upcoming")} description={t("events.greeting", { name: user.name.split(" ")[0] })} />
      {events.length === 0 && <EmptyState>{t("events.empty")}</EmptyState>}
      <div className="grid gap-3">
        {events.map((e) => {
          const spotsLeft = Math.max(0, e.maxPlayers - e.confirmedCount);
          const chip = dateChip(e.startsAt, locale);
          return (
            <Link key={e.id} href={`/events/${e.id}`}>
              <Card className="flex items-center gap-3 transition-colors hover:bg-muted/50">
                <div className="flex w-14 shrink-0 flex-col items-center rounded-lg bg-secondary py-2 text-secondary-foreground">
                  <span className="text-xs uppercase">{chip.weekday}</span>
                  <span className="text-lg font-semibold leading-none">{chip.day}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-semibold">{e.title}</span>
                    <MyStatusBadge status={e.myStatus} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatDay(e.startsAt, locale)} · {formatTimeRange(e.startsAt, e.endsAt)}
                  </p>
                  {e.venue && (
                    <p className="flex items-center gap-1 truncate text-sm text-muted-foreground">
                      <MapPin className="size-3.5" />
                      {e.venue.name}
                    </p>
                  )}
                  <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                    <EventStatusBadge status={e.status} />
                    <span className="text-muted-foreground">
                      {spotsLeft > 0
                        ? t("events.spotsLeft", { left: spotsLeft, max: e.maxPlayers })
                        : t("events.full", { count: e.waitlistCount })}
                    </span>
                  </div>
                </div>
                <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
              </Card>
            </Link>
          );
        })}
      </div>
    </>
  );
}
