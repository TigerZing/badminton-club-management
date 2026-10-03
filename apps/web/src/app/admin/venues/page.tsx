import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, EmptyState, PageHeader } from "@/components/ui/card";
import { getT } from "@/lib/i18n/server";
import { listVenues } from "@/server/services/venues";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t("adminVenues.title") };
}

export default async function VenuesPage() {
  const [{ t }, venues] = await Promise.all([getT(), listVenues({ activeOnly: false })]);
  return (
    <>
      <PageHeader
        title={t("adminVenues.title")}
        action={
          <Link href="/admin/venues/new" className={buttonVariants({ size: "sm" })}>
            {t("adminVenues.add")}
          </Link>
        }
      />
      {venues.length === 0 && <EmptyState>{t("adminVenues.empty")}</EmptyState>}
      <div className="stagger grid gap-2">
        {venues.map((v) => (
          <Link key={v.id} href={`/admin/venues/${v.id}`}>
            <Card interactive className="flex items-center justify-between gap-2">
              <div>
                <p className="font-medium">{v.name}</p>
                <p className="text-sm text-muted-foreground">{t("adminVenues.courtCount", { count: v._count.courts })}</p>
              </div>
              <div className="flex gap-1">
                {!v.isActive && <Badge variant="muted">{t("adminVenues.hidden")}</Badge>}
                <Badge variant="muted">{v.crawlerKey ? t("adminVenues.crawler", { key: v.crawlerKey }) : t("adminVenues.manual")}</Badge>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}
