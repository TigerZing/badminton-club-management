import { ZodError } from "zod";
import { getT } from "@/lib/i18n/server";
import { hasMessage, type MessageKey } from "@/lib/i18n/translate";
import { UserError } from "./errors";

export type ActionState = { ok: boolean; error?: string; message?: string } | null;

/**
 * Runs an action body and turns expected failures into an inline form error.
 * The body may return a message key to confirm success. Anything else
 * (including Next.js redirects) is rethrown.
 */
export async function run(fn: () => Promise<MessageKey | void>): Promise<ActionState> {
  try {
    const message = await fn();
    const { t } = await getT();
    return { ok: true, message: message ? t(message) : undefined };
  } catch (e) {
    const { t } = await getT();
    if (e instanceof UserError) return { ok: false, error: t(e.key, e.params) };
    if (e instanceof ZodError) {
      const issue = e.issues[0]?.message;
      return { ok: false, error: issue && hasMessage(issue) ? t(issue) : (issue ?? t("errors.invalidInput")) };
    }
    throw e;
  }
}
