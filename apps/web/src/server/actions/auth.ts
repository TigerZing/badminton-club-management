"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "../auth";
import { run, type ActionState } from "../action-result";
import { UserError } from "../errors";
import { loginSchema, registerUserSchema } from "../schemas";
import { createMember } from "../services/members";

export async function loginAction(_: ActionState, formData: FormData): Promise<ActionState> {
  return run(async () => {
    const input = loginSchema.parse(Object.fromEntries(formData));
    try {
      await signIn("credentials", { ...input, redirectTo: "/events" });
    } catch (e) {
      if (e instanceof AuthError) throw new UserError("errors.wrongCredentials");
      throw e;
    }
  });
}

export async function registerAction(_: ActionState, formData: FormData): Promise<ActionState> {
  return run(async () => {
    const input = registerUserSchema.parse(Object.fromEntries(formData));
    await createMember(input);
    await signIn("credentials", { email: input.email, password: input.password, redirectTo: "/events" });
  });
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}
