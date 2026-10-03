import Link from "next/link";
import { History } from "lucide-react";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { Card, PageHeader } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { updateProfileAction } from "@/server/actions/account";
import { requireUser } from "@/server/session";

export const metadata = { title: "My profile" };

export default async function MePage() {
  const user = await requireUser();
  return (
    <>
      <PageHeader title="My profile" description={user.email} />
      <div className="grid gap-4">
        <Card className="grid grid-cols-2 gap-3 text-center">
          <div>
            <p className="text-2xl font-semibold">{user.skillLevel}</p>
            <p className="text-xs text-muted-foreground">Skill level (set by admins)</p>
          </div>
          <div>
            <p className="text-2xl font-semibold">{user.role === "ADMIN" ? "Admin" : "Member"}</p>
            <p className="text-xs text-muted-foreground">Role</p>
          </div>
        </Card>
        <Link href="/me/history">
          <Card className="flex items-center gap-2 font-medium hover:bg-muted/50">
            <History className="size-4" /> Match history
          </Card>
        </Link>
        <Card>
          <ActionForm action={updateProfileAction}>
            <Field label="Name" htmlFor="name">
              <Input id="name" name="name" defaultValue={user.name} required />
            </Field>
            <Field label="Phone" htmlFor="phone" hint="Optional, visible to admins only">
              <Input id="phone" name="phone" type="tel" defaultValue={user.phone ?? ""} />
            </Field>
            <SubmitButton className="justify-self-start">Save</SubmitButton>
          </ActionForm>
        </Card>
      </div>
    </>
  );
}
