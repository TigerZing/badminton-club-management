import Link from "next/link";
import { redirect } from "next/navigation";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { loginAction } from "@/server/actions/auth";
import { currentUser } from "@/server/session";

export const metadata = { title: "Sign in" };

export default async function LoginPage() {
  if (await currentUser()) redirect("/events");
  return (
    <Card className="p-6">
      <ActionForm action={loginAction}>
        <Field label="Email" htmlFor="email">
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </Field>
        <Field label="Password" htmlFor="password">
          <Input id="password" name="password" type="password" autoComplete="current-password" required />
        </Field>
        <SubmitButton className="mt-2 w-full" pendingText="Signing in…">
          Sign in
        </SubmitButton>
      </ActionForm>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        New to the club?{" "}
        <Link href="/register" className="font-medium text-primary">
          Create an account
        </Link>
      </p>
    </Card>
  );
}
