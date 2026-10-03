export const locales = ["vi", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "vi";
export const LOCALE_COOKIE = "locale";

export const isLocale = (v: unknown): v is Locale => locales.includes(v as Locale);

/** BCP 47 tags used for dates and numbers. */
export const intlLocale: Record<Locale, string> = { vi: "vi-VN", en: "en-GB" };
