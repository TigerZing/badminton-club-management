import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { Card, CardTitle, PageHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MemberForm } from "@/components/member-form";
import { getT } from "@/lib/i18n/server";
import { formatDay } from "@/lib/time";
import { resetPasswordAction } from "@/server/actions/admin";
import { getMemberDetail } from "@/server/services/members";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t("adminMembers.pageTitle") };
}

export default async function MemberPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const [{ id }, { created }] = await Promise.all([params, searchParams]);
  const [{ t, locale }, detail] = await Promise.all([getT(), getMemberDetail(id)]);
  if (!detail) notFound();
  const { user, registrations, matches } = detail;

  return (
    <div className="grid gap-5">
      <div>
        <Link href="/admin/members" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
          <ArrowLeft className="size-4" /> {t("adminMembers.title")}
        </Link>
        <PageHeader
          title={user.name}
          description={t("adminMembers.memberSummary", { date: formatDay(user.createdAt, locale), sessions: registrations, matches })}
        />
        {created && (
          <p className="rounded-lg bg-success/10 p-3 text-sm text-success">
            {t("adminMembers.created")}
          </p>
        )}
      </div>

      <section>
        <CardTitle className="mb-2">{t("adminMembers.details")}</CardTitle>
        <Card>
          <MemberForm member={user} />
        </Card>
      </section>

      <section>
        <CardTitle className="mb-2">{t("adminMembers.resetPassword")}</CardTitle>
        <Card>
          <ActionForm action={resetPasswordAction}>
            <input type="hidden" name="userId" value={user.id} />
            <p className="text-sm text-muted-foreground">
              {t("adminMembers.resetHint")}
            </p>
            <Input name="password" type="text" autoComplete="off" minLength={8} placeholder={t("adminMembers.newPasswordPlaceholder")} aria-label={t("adminMembers.newPassword")} required />
            <SubmitButton variant="secondary" className="justify-self-start">
              {t("adminMembers.setPassword")}
            </SubmitButton>
          </ActionForm>
        </Card>
      </section>
    </div>
  );
}
