import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, EmptyState, PageHeader } from "@/components/ui/card";
import { listVenues } from "@/server/services/venues";

export const metadata = { title: "Venues" };

export default async function VenuesPage() {
  const venues = await listVenues({ activeOnly: false });
  return (
    <>
      <PageHeader
        title="Venues"
        action={
          <Link href="/admin/venues/new" className={buttonVariants({ size: "sm" })}>
            Add venue
          </Link>
        }
      />
      {venues.length === 0 && <EmptyState>Add the halls where the club plays.</EmptyState>}
      <div className="grid gap-2">
        {venues.map((v) => (
          <Link key={v.id} href={`/admin/venues/${v.id}`}>
            <Card className="flex items-center justify-between gap-2 hover:bg-muted/50">
              <div>
                <p className="font-medium">{v.name}</p>
                <p className="text-sm text-muted-foreground">{v._count.courts} courts</p>
              </div>
              <div className="flex gap-1">
                {!v.isActive && <Badge variant="muted">Hidden</Badge>}
                <Badge variant="muted">{v.crawlerKey ? `Crawler: ${v.crawlerKey}` : "Manual"}</Badge>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}
