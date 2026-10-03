import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, EmptyState, PageHeader } from "@/components/ui/card";
import { EventStatusBadge } from "@/components/event-bits";
import { getT } from "@/lib/i18n/server";
import { formatDay, formatTimeRange } from "@/lib/time";
import { listEventsForAdmin } from "@/server/services/events";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t("adminEvents.pageTitle") };
}

export default async function AdminEventsPage() {
  const [{ t, locale }, events] = await Promise.all([getT(), listEventsForAdmin()]);
  return (
    <>
      <PageHeader
        title={t("adminEvents.title")}
        action={
          <Link href="/admin/events/new" className={buttonVariants({ size: "sm" })}>
            {t("adminEvents.newEvent")}
          </Link>
        }
      />
      {events.length === 0 && <EmptyState>{t("adminEvents.noEvents")}</EmptyState>}
      <div className="grid gap-2">
        {events.map((e) => (
          <Link key={e.id} href={`/admin/events/${e.id}`}>
            <Card className="flex items-center justify-between gap-2 hover:bg-muted/50">
              <div className="min-w-0">
                <p className="truncate font-medium">{e.title}</p>
                <p className="text-sm text-muted-foreground">
                  {formatDay(e.startsAt, locale)} · {formatTimeRange(e.startsAt, e.endsAt)}
                  {e.venue ? ` · ${e.venue.name}` : ""} · {e._count.registrations}/{e.maxPlayers}
                </p>
              </div>
              <EventStatusBadge status={e.status} />
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}
