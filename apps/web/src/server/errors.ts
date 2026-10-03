import type { MessageKey, MessageParams } from "@/lib/i18n/translate";

/** An error that is safe to show to the user. The message is a translation key. */
export class UserError extends Error {
  constructor(
    public readonly key: MessageKey,
    public readonly params?: MessageParams,
  ) {
    super(key);
  }
}
