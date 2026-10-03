import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { Card, CardTitle, PageHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MemberForm } from "@/components/member-form";
import { formatDay } from "@/lib/time";
import { resetPasswordAction } from "@/server/actions/admin";
import { getMemberDetail } from "@/server/services/members";

export const metadata = { title: "Member" };

export default async function MemberPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const [{ id }, { created }] = await Promise.all([params, searchParams]);
  const detail = await getMemberDetail(id);
  if (!detail) notFound();
  const { user, registrations, matches } = detail;

  return (
    <div className="grid gap-5">
      <div>
        <Link href="/admin/members" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
          <ArrowLeft className="size-4" /> Members
        </Link>
        <PageHeader
          title={user.name}
          description={`Joined ${formatDay(user.createdAt)} · ${registrations} sessions · ${matches} matches`}
        />
        {created && (
          <p className="rounded-lg bg-success/10 p-3 text-sm text-success">
            Member added. Share their email and temporary password so they can sign in.
          </p>
        )}
      </div>

      <section>
        <CardTitle className="mb-2">Details</CardTitle>
        <Card>
          <MemberForm member={user} />
        </Card>
      </section>

      <section>
        <CardTitle className="mb-2">Reset password</CardTitle>
        <Card>
          <ActionForm action={resetPasswordAction}>
            <input type="hidden" name="userId" value={user.id} />
            <p className="text-sm text-muted-foreground">
              Use this when a member forgets their password. Give them the new one; they can change it under Me.
            </p>
            <Input name="password" type="text" autoComplete="off" minLength={8} placeholder="New password (8+ characters)" aria-label="New password" required />
            <SubmitButton variant="secondary" className="justify-self-start">
              Set new password
            </SubmitButton>
          </ActionForm>
        </Card>
      </section>
    </div>
  );
}
