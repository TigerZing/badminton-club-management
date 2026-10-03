import { ActionForm, SubmitButton } from "@/components/action-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, PageHeader } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { updateMemberAction } from "@/server/actions/admin";
import { listMembers } from "@/server/services/members";

export const metadata = { title: "Members" };

export default async function MembersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const members = await listMembers(q);

  return (
    <>
      <PageHeader title="Members" description={`${members.length} shown`} />
      <form className="mb-4 flex gap-2">
        <Input name="q" defaultValue={q} placeholder="Search name or email" aria-label="Search" />
        <Button type="submit" variant="secondary">
          Search
        </Button>
      </form>
      <div className="grid gap-2">
        {members.map((m) => (
          <Card key={m.id} className={m.isActive ? undefined : "opacity-60"}>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="font-medium">{m.name}</span>
              {m.role === "ADMIN" && <Badge>Admin</Badge>}
              {!m.isActive && <Badge variant="muted">Inactive</Badge>}
              <span className="w-full truncate text-xs text-muted-foreground">
                {m.email}
                {m.phone ? ` · ${m.phone}` : ""}
              </span>
            </div>
            <ActionForm action={updateMemberAction} className="grid-cols-[5rem_1fr_auto] items-end gap-2">
              <input type="hidden" name="userId" value={m.id} />
              <label className="grid gap-1 text-xs text-muted-foreground">
                Skill
                <Input name="skillLevel" type="number" min={1} max={10} defaultValue={m.skillLevel} />
              </label>
              <label className="grid gap-1 text-xs text-muted-foreground">
                Role
                <Select name="role" defaultValue={m.role}>
                  <option value="MEMBER">Member</option>
                  <option value="ADMIN">Admin</option>
                </Select>
              </label>
              <SubmitButton size="default" variant="secondary">
                Save
              </SubmitButton>
              <label className="col-span-3 flex items-center gap-2 text-sm">
                <input type="checkbox" name="isActive" defaultChecked={m.isActive} className="size-4 accent-primary" />
                Active member
              </label>
            </ActionForm>
          </Card>
        ))}
      </div>
    </>
  );
}
