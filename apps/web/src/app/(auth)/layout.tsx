import { LanguageSwitch } from "@/components/language-switch";
import { getT } from "@/lib/i18n/server";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const { t } = await getT();
  return (
    <main className="relative mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-4 py-10">
      <LanguageSwitch className="absolute top-4 right-4" />
      <div className="mb-6 text-center">
        <div className="text-4xl">🏸</div>
        <h1 className="mt-2 text-2xl font-semibold">{t("common.appName")}</h1>
      </div>
      {children}
    </main>
  );
}
