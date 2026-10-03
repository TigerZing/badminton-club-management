import Link from "next/link";
import { ChevronRight, MapPin } from "lucide-react";
import { Card, EmptyState, PageHeader } from "@/components/ui/card";
import { EventStatusBadge, MyStatusBadge } from "@/components/event-bits";
import { formatDay, formatTimeRange } from "@/lib/time";
import { requireUser } from "@/server/session";
import { listUpcomingEvents } from "@/server/services/events";

export const metadata = { title: "Events" };

export default async function EventsPage() {
  const user = await requireUser();
  const events = await listUpcomingEvents(user.id);

  return (
    <>
      <PageHeader title="Upcoming sessions" description={`Hi ${user.name.split(" ")[0]}, pick a session to join.`} />
      {events.length === 0 && <EmptyState>No sessions are open yet. Check back soon.</EmptyState>}
      <div className="grid gap-3">
        {events.map((e) => {
          const spotsLeft = Math.max(0, e.maxPlayers - e.confirmedCount);
          return (
            <Link key={e.id} href={`/events/${e.id}`}>
              <Card className="flex items-center gap-3 transition-colors hover:bg-muted/50">
                <div className="flex w-14 shrink-0 flex-col items-center rounded-lg bg-secondary py-2 text-secondary-foreground">
                  <span className="text-xs uppercase">{formatDay(e.startsAt).split(" ")[0]}</span>
                  <span className="text-lg font-semibold leading-none">{formatDay(e.startsAt).split(" ")[1]}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-semibold">{e.title}</span>
                    <MyStatusBadge status={e.myStatus} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatDay(e.startsAt)} · {formatTimeRange(e.startsAt, e.endsAt)}
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
                      {spotsLeft > 0 ? `${spotsLeft} of ${e.maxPlayers} spots left` : `Full · ${e.waitlistCount} waiting`}
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
