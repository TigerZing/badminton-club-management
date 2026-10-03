import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, EmptyState, PageHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SkillDot } from "@/components/event-bits";
import { listMembers } from "@/server/services/members";

export const metadata = { title: "Members" };

export default async function MembersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const members = await listMembers(q);
  const active = members.filter((m) => m.isActive).length;

  return (
    <>
      <PageHeader
        title="Members"
        description={`${active} active · ${members.length - active} inactive`}
        action={
          <Link href="/admin/members/new" className={buttonVariants({ size: "sm" })}>
            Add member
          </Link>
        }
      />
      <form className="mb-4 flex gap-2">
        <Input name="q" defaultValue={q} placeholder="Search name or email" aria-label="Search" />
        <Button type="submit" variant="secondary">
          Search
        </Button>
      </form>
      {members.length === 0 && <EmptyState>No members found.</EmptyState>}
      <div className="grid gap-2">
        {members.map((m) => (
          <Link key={m.id} href={`/admin/members/${m.id}`}>
            <Card className={`flex items-center gap-3 p-3 hover:bg-muted/50 ${m.isActive ? "" : "opacity-60"}`}>
              <SkillDot level={m.skillLevel} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-medium">{m.name}</span>
                  {m.role === "ADMIN" && <Badge>Admin</Badge>}
                  {!m.isActive && <Badge variant="muted">Inactive</Badge>}
                </div>
                <p className="truncate text-xs text-muted-foreground">
                  {m.email}
                  {m.phone ? ` · ${m.phone}` : ""}
                </p>
              </div>
              <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}
