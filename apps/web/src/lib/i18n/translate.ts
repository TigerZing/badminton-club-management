import type { Locale } from "./config";
import { en } from "./messages/en";
import { vi } from "./messages/vi";

export type Messages = typeof en;

type Join<P extends string, K extends string> = `${P}.${K}`;
type Keys<T, P extends string = never> = {
  [K in keyof T & string]: T[K] extends string ? ([P] extends [never] ? K : Join<P, K>) : Keys<T[K], [P] extends [never] ? K : Join<P, K>>;
}[keyof T & string];

/** A dotted key such as "events.title". */
export type MessageKey = Keys<Messages>;
export type MessageParams = Record<string, string | number>;
export type TFunction = (key: MessageKey, params?: MessageParams) => string;

const dictionaries: Record<Locale, Messages> = { en, vi };

function lookup(messages: Messages, key: string): string | undefined {
  let node: unknown = messages;
  for (const part of key.split(".")) {
    if (typeof node !== "object" || node === null) return undefined;
    node = (node as Record<string, unknown>)[part];
  }
  return typeof node === "string" ? node : undefined;
}

export function hasMessage(key: string): key is MessageKey {
  return lookup(en, key) !== undefined;
}

/** Returns the text for a key in the locale, falling back to English, then to the key itself. */
export function translate(locale: Locale, key: string, params?: MessageParams): string {
  const text = lookup(dictionaries[locale], key) ?? lookup(en, key) ?? key;
  return params ? text.replace(/\{(\w+)\}/g, (m, name: string) => (name in params ? String(params[name]) : m)) : text;
}

export function createT(locale: Locale): TFunction {
  return (key, params) => translate(locale, key, params);
}
