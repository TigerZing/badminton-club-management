import Link from "next/link";
import { redirect } from "next/navigation";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { getT } from "@/lib/i18n/server";
import { loginAction } from "@/server/actions/auth";
import { currentUser } from "@/server/session";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t("auth.signIn") };
}

export default async function LoginPage() {
  if (await currentUser()) redirect("/events");
  const { t } = await getT();
  return (
    <Card className="p-6">
      <ActionForm action={loginAction}>
        <Field label={t("auth.email")} htmlFor="email">
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </Field>
        <Field label={t("auth.password")} htmlFor="password">
          <Input id="password" name="password" type="password" autoComplete="current-password" required />
        </Field>
        <SubmitButton className="mt-2 w-full" pendingText={t("auth.signingIn")}>
          {t("auth.signIn")}
        </SubmitButton>
      </ActionForm>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        {t("auth.newToClub")}{" "}
        <Link href="/register" className="font-medium text-primary">
          {t("auth.createAnAccount")}
        </Link>
      </p>
    </Card>
  );
}
