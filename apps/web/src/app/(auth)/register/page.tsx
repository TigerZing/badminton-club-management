import Link from "next/link";
import { redirect } from "next/navigation";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { getT } from "@/lib/i18n/server";
import { registerAction } from "@/server/actions/auth";
import { currentUser } from "@/server/session";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t("auth.createAccount") };
}

export default async function RegisterPage() {
  if (await currentUser()) redirect("/events");
  const { t } = await getT();
  return (
    <Card className="p-6">
      <ActionForm action={registerAction}>
        <Field label={t("auth.name")} htmlFor="name">
          <Input id="name" name="name" autoComplete="name" required />
        </Field>
        <Field label={t("auth.email")} htmlFor="email">
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </Field>
        <Field label={t("auth.password")} htmlFor="password" hint={t("auth.passwordHint")}>
          <Input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />
        </Field>
        <SubmitButton className="mt-2 w-full" pendingText={t("auth.creatingAccount")}>
          {t("auth.createAccount")}
        </SubmitButton>
      </ActionForm>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        {t("auth.alreadyMember")}{" "}
        <Link href="/login" className="font-medium text-primary">
          {t("auth.signIn")}
        </Link>
      </p>
    </Card>
  );
}
