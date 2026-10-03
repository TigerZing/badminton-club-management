import { EmptyState, PageHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getT } from "@/lib/i18n/server";
import { formatDay } from "@/lib/time";
import { requireUser } from "@/server/session";
import { getMatchHistory } from "@/server/services/matches";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t("me.matchHistory") };
}

export default async function HistoryPage() {
  const user = await requireUser();
  const [{ t, locale }, matches] = await Promise.all([getT(), getMatchHistory(user.id)]);

  return (
    <>
      <PageHeader title={t("me.matchHistory")} description={t("me.matchCount", { count: matches.length })} />
      {matches.length === 0 && <EmptyState>{t("me.historyEmpty")}</EmptyState>}
      <ul className="grid gap-2">
        {matches.map((m) => {
          const myTeam = m.players.find((p) => p.userId === user.id)!.team;
          const partner = m.players.find((p) => p.team === myTeam && p.userId !== user.id);
          const opponents = m.players.filter((p) => p.team !== myTeam);
          const [mine, theirs] = myTeam === "A" ? [m.scoreA, m.scoreB] : [m.scoreB, m.scoreA];
          const scored = mine !== null && theirs !== null;
          return (
            <li key={m.id} className="rounded-lg border border-border bg-card p-3 text-sm">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {formatDay(m.round.event.startsAt, locale)} · {m.round.event.title} · {t("status.round", { number: m.round.number })}
                </span>
                {scored && (
                  <Badge variant={mine! > theirs! ? "success" : mine! < theirs! ? "destructive" : "muted"}>
                    {mine} – {theirs}
                  </Badge>
                )}
              </div>
              <p className="mt-1">
                {t("me.with")} <span className="font-medium">{partner?.user.name ?? "?"}</span> {t("status.vs")}{" "}
                {opponents.map((o) => o.user.name).join(" & ")}
              </p>
            </li>
          );
        })}
      </ul>
    </>
  );
}
