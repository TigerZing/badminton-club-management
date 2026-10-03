import { BrandMark } from "@/components/brand";
import { LanguageSwitch } from "@/components/language-switch";
import { ThemeToggle } from "@/components/theme-toggle";
import { getT } from "@/lib/i18n/server";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const { t } = await getT();
  return (
    <main className="relative mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-4 py-10">
      <div className="absolute top-4 right-4 flex items-center gap-1">
        <ThemeToggle />
        <LanguageSwitch />
      </div>
      <div className="mb-7 flex animate-rise flex-col items-center text-center">
        <BrandMark className="size-16 rounded-2xl shadow-lg" />
        <h1 className="mt-3 text-2xl font-bold tracking-tight">{t("common.appName")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("common.tagline")}</p>
      </div>
      <div className="animate-rise [animation-delay:80ms]">{children}</div>
    </main>
  );
}
