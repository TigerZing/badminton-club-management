import { cache } from "react";
import { cookies } from "next/headers";
import { defaultLocale, isLocale, LOCALE_COOKIE, type Locale } from "./config";
import { createT } from "./translate";

export const getLocale = cache(async (): Promise<Locale> => {
  const value = (await cookies()).get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : defaultLocale;
});

/** The translator for the current request, plus its locale for date formatting. */
export async function getT() {
  const locale = await getLocale();
  return { t: createT(locale), locale };
}
