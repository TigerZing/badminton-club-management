import { EmptyState, PageHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDay } from "@/lib/time";
import { requireUser } from "@/server/session";
import { getMatchHistory } from "@/server/services/matches";

export const metadata = { title: "Match history" };

export default async function HistoryPage() {
  const user = await requireUser();
  const matches = await getMatchHistory(user.id);

  return (
    <>
      <PageHeader title="Match history" description={`${matches.length} matches`} />
      {matches.length === 0 && <EmptyState>Your matches will show up here after your first session.</EmptyState>}
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
                  {formatDay(m.round.event.startsAt)} · {m.round.event.title} · Round {m.round.number}
                </span>
                {scored && (
                  <Badge variant={mine! > theirs! ? "success" : mine! < theirs! ? "destructive" : "muted"}>
                    {mine} – {theirs}
                  </Badge>
                )}
              </div>
              <p className="mt-1">
                With <span className="font-medium">{partner?.user.name ?? "?"}</span> vs{" "}
                {opponents.map((o) => o.user.name).join(" & ")}
              </p>
            </li>
          );
        })}
      </ul>
    </>
  );
}
