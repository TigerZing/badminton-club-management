import type { RoundWithMatches } from "@/server/services/matches";
import { Badge } from "@/components/ui/badge";
import { getT } from "@/lib/i18n/server";
import { cn } from "@/lib/utils";

type MatchT = RoundWithMatches["matches"][number];

export function Team({ match, team, highlight }: { match: MatchT; team: "A" | "B"; highlight?: string }) {
  const players = match.players.filter((p) => p.team === team);
  return (
    <div className="grid gap-0.5">
      {players.map((p) => (
        <span key={p.userId} className={cn("truncate", p.userId === highlight && "font-semibold text-primary")}>
          {p.user.name}
        </span>
      ))}
    </div>
  );
}

export async function MatchCard({ match, highlight }: { match: MatchT; highlight?: string }) {
  const { t } = await getT();
  const mine = match.players.some((p) => p.userId === highlight);
  const scored = match.scoreA !== null && match.scoreB !== null;
  return (
    <div className={cn("rounded-lg border border-border p-3", mine && "border-primary bg-primary/5")}>
      <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
        <span className="font-medium text-foreground">{t("status.court", { number: match.courtNumber })}</span>
        {mine && <Badge>{t("status.yourMatch")}</Badge>}
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-sm">
        <Team match={match} team="A" highlight={highlight} />
        <span className="text-xs text-muted-foreground">{scored ? `${match.scoreA} – ${match.scoreB}` : t("status.vs")}</span>
        <div className="text-right">
          <Team match={match} team="B" highlight={highlight} />
        </div>
      </div>
    </div>
  );
}

const ROUND_STATUS = { DRAFT: "status.roundDraft", PUBLISHED: "status.roundPublished", DONE: "status.roundDone" } as const;

export async function RoundHeader({ round }: { round: RoundWithMatches }) {
  const { t } = await getT();
  const label = t(ROUND_STATUS[round.status]);
  return (
    <div className="mb-2 flex items-center gap-2">
      <h3 className="font-semibold">{t("status.round", { number: round.number })}</h3>
      <Badge variant={round.status === "PUBLISHED" ? "default" : "muted"}>{label}</Badge>
    </div>
  );
}
