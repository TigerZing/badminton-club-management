import { ZodError } from "zod";
import { UserError } from "./errors";

export type ActionState = { ok: boolean; error?: string; message?: string } | null;

/**
 * Runs an action body and turns expected failures into an inline form error.
 * Anything else (including Next.js redirects) is rethrown.
 */
export async function run(fn: () => Promise<string | void>): Promise<ActionState> {
  try {
    const message = await fn();
    return { ok: true, message: message || undefined };
  } catch (e) {
    if (e instanceof UserError) return { ok: false, error: e.message };
    if (e instanceof ZodError) return { ok: false, error: e.issues[0]?.message ?? "Invalid input" };
    throw e;
  }
}
