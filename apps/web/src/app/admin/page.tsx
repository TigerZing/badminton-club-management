import Link from "next/link";
import { Card, CardTitle, EmptyState, PageHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { EventStatusBadge } from "@/components/event-bits";
import { getT } from "@/lib/i18n/server";
import { formatDateTime, formatDay, formatTimeRange } from "@/lib/time";
import { prisma } from "@club/db";
import { listVenues } from "@/server/services/venues";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t("adminOverview.title") };
}

const crawlStatusKey = {
  RUNNING: "adminOverview.crawlRunning",
  FAILED: "adminOverview.crawlFailed",
} as const;

export default async function AdminHome() {
  const { t, locale } = await getT();
  const since = new Date(Date.now() - 24 * 3600_000);
  const [events, members, venues] = await Promise.all([
    prisma.event.findMany({
      where: { endsAt: { gte: since }, status: { not: "CANCELLED" } },
      orderBy: { startsAt: "asc" },
      take: 5,
      include: {
        _count: {
          select: { registrations: { where: { status: "CONFIRMED" } } },
        },
      },
    }),
    prisma.user.count({ where: { isActive: true } }),
    listVenues({ activeOnly: true }),
  ]);

  return (
    <>
      <PageHeader
        title={t("adminOverview.title")}
        description={t("adminOverview.activeMembers", { count: members })}
        action={
          <Link href="/admin/events/new" className={buttonVariants({ size: "sm" })}>
            {t("adminOverview.newEvent")}
          </Link>
        }
      />
      <section className="grid gap-2">
        <CardTitle>{t("adminOverview.comingUp")}</CardTitle>
        {events.length === 0 && <EmptyState>{t("adminOverview.noUpcoming")}</EmptyState>}
        {events.map((e) => (
          <Link key={e.id} href={`/admin/events/${e.id}`}>
            <Card interactive className="flex items-center justify-between gap-2">
              <div>
                <p className="font-medium">{e.title}</p>
                <p className="text-sm text-muted-foreground">
                  {formatDay(e.startsAt, locale)} · {formatTimeRange(e.startsAt, e.endsAt)} · {e._count.registrations}/
                  {e.maxPlayers}
                </p>
              </div>
              <EventStatusBadge status={e.status} />
            </Card>
          </Link>
        ))}
      </section>
      <section className="mt-6 grid gap-2">
        <CardTitle>{t("adminOverview.courtData")}</CardTitle>
        {venues.length === 0 && <EmptyState>{t("adminOverview.noVenues")}</EmptyState>}
        {venues.map((v) => {
          const run = v.crawlRuns[0];
          return (
            <Link key={v.id} href={`/admin/venues/${v.id}`}>
              <Card interactive className="flex items-center justify-between gap-2">
                <span className="font-medium">{v.name}</span>
                {v.crawlerKey ? (
                  run ? (
                    <Badge variant={run.status === "OK" ? "success" : run.status === "FAILED" ? "destructive" : "muted"}>
                      {run.status === "OK"
                        ? t("adminOverview.crawledAt", {
                            date: formatDateTime(run.startedAt, locale),
                          })
                        : t(crawlStatusKey[run.status])}
                    </Badge>
                  ) : (
                    <Badge variant="muted">{t("adminOverview.neverCrawled")}</Badge>
                  )
                ) : (
                  <Badge variant="muted">{t("adminOverview.manual")}</Badge>
                )}
              </Card>
            </Link>
          );
        })}
      </section>
    </>
  );
}
