import Link from "next/link";
import { History } from "lucide-react";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { Card, PageHeader } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { getT } from "@/lib/i18n/server";
import { changePasswordAction, updateProfileAction } from "@/server/actions/account";
import { requireUser } from "@/server/session";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t("me.title") };
}

export default async function MePage() {
  const user = await requireUser();
  const { t } = await getT();
  return (
    <>
      <PageHeader title={t("me.title")} description={user.email} />
      <div className="grid gap-4">
        <Card className="grid grid-cols-2 gap-3 text-center">
          <div>
            <p className="text-2xl font-semibold">{user.skillLevel}</p>
            <p className="text-xs text-muted-foreground">{t("me.skillLevel")}</p>
          </div>
          <div>
            <p className="text-2xl font-semibold">{user.role === "ADMIN" ? t("status.admin") : t("status.member")}</p>
            <p className="text-xs text-muted-foreground">{t("me.role")}</p>
          </div>
        </Card>
        <Link href="/me/history">
          <Card interactive className="flex items-center gap-2 font-medium">
            <History className="size-4" /> {t("me.matchHistory")}
          </Card>
        </Link>
        <Card>
          <ActionForm action={updateProfileAction}>
            <Field label={t("me.name")} htmlFor="name">
              <Input id="name" name="name" defaultValue={user.name} required />
            </Field>
            <Field label={t("me.phone")} htmlFor="phone" hint={t("me.phoneHint")}>
              <Input id="phone" name="phone" type="tel" defaultValue={user.phone ?? ""} />
            </Field>
            <SubmitButton className="justify-self-start">{t("common.save")}</SubmitButton>
          </ActionForm>
        </Card>
        <Card>
          <h2 className="mb-3 font-semibold">{t("me.changePassword")}</h2>
          <ActionForm action={changePasswordAction}>
            <Field label={t("me.currentPassword")} htmlFor="currentPassword">
              <Input id="currentPassword" name="currentPassword" type="password" autoComplete="current-password" required />
            </Field>
            <Field label={t("me.newPassword")} htmlFor="newPassword" hint={t("me.passwordHint")}>
              <Input id="newPassword" name="newPassword" type="password" autoComplete="new-password" minLength={8} required />
            </Field>
            <Field label={t("me.repeatPassword")} htmlFor="confirmPassword">
              <Input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" minLength={8} required />
            </Field>
            <SubmitButton className="justify-self-start" variant="secondary">
              {t("me.changePassword")}
            </SubmitButton>
          </ActionForm>
        </Card>
      </div>
    </>
  );
}
