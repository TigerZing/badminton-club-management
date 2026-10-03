import Link from "next/link";
import { Card, CardTitle, EmptyState, PageHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { EventStatusBadge } from "@/components/event-bits";
import { formatDateTime, formatDay, formatTimeRange } from "@/lib/time";
import { prisma } from "@club/db";
import { listVenues } from "@/server/services/venues";

export const metadata = { title: "Admin" };

export default async function AdminHome() {
  const since = new Date(Date.now() - 24 * 3600_000);
  const [events, members, venues] = await Promise.all([
    prisma.event.findMany({
      where: { endsAt: { gte: since }, status: { not: "CANCELLED" } },
      orderBy: { startsAt: "asc" },
      take: 5,
      include: { _count: { select: { registrations: { where: { status: "CONFIRMED" } } } } },
    }),
    prisma.user.count({ where: { isActive: true } }),
    listVenues({ activeOnly: true }),
  ]);

  return (
    <>
      <PageHeader
        title="Admin"
        description={`${members} active members`}
        action={
          <Link href="/admin/events/new" className={buttonVariants({ size: "sm" })}>
            New event
          </Link>
        }
      />
      <section className="grid gap-2">
        <CardTitle>Coming up</CardTitle>
        {events.length === 0 && <EmptyState>No upcoming events. Create one for this weekend.</EmptyState>}
        {events.map((e) => (
          <Link key={e.id} href={`/admin/events/${e.id}`}>
            <Card className="flex items-center justify-between gap-2 hover:bg-muted/50">
              <div>
                <p className="font-medium">{e.title}</p>
                <p className="text-sm text-muted-foreground">
                  {formatDay(e.startsAt)} · {formatTimeRange(e.startsAt, e.endsAt)} · {e._count.registrations}/{e.maxPlayers}
                </p>
              </div>
              <EventStatusBadge status={e.status} />
            </Card>
          </Link>
        ))}
      </section>
      <section className="mt-6 grid gap-2">
        <CardTitle>Court data</CardTitle>
        {venues.length === 0 && <EmptyState>No venues yet.</EmptyState>}
        {venues.map((v) => {
          const run = v.crawlRuns[0];
          return (
            <Link key={v.id} href={`/admin/venues/${v.id}`}>
              <Card className="flex items-center justify-between gap-2 hover:bg-muted/50">
                <span className="font-medium">{v.name}</span>
                {v.crawlerKey ? (
                  run ? (
                    <Badge variant={run.status === "OK" ? "success" : run.status === "FAILED" ? "destructive" : "muted"}>
                      {run.status === "OK" ? `Crawled ${formatDateTime(run.startedAt)}` : run.status.toLowerCase()}
                    </Badge>
                  ) : (
                    <Badge variant="muted">Never crawled</Badge>
                  )
                ) : (
                  <Badge variant="muted">Manual</Badge>
                )}
              </Card>
            </Link>
          );
        })}
      </section>
    </>
  );
}
