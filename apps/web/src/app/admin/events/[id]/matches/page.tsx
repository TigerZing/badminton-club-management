import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@club/db";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { Card, CardTitle, EmptyState } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { SkillDot } from "@/components/event-bits";
import { MatchCard, RoundHeader } from "@/components/round-view";
import {
  completeRoundAction,
  deleteDraftRoundAction,
  generateRoundAction,
  publishRoundAction,
  recordScoreAction,
  updateRoundMatchesAction,
} from "@/server/actions/admin";
import { getCheckedInPlayers, listRounds, type RoundWithMatches } from "@/server/services/matches";

export const metadata = { title: "Match board" };

type CheckedIn = Awaited<ReturnType<typeof getCheckedInPlayers>>;

export default async function MatchBoardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) notFound();
  const [players, rounds] = await Promise.all([getCheckedInPlayers(id), listRounds(id, { includeDrafts: true })]);
  const open = rounds.find((r) => r.status !== "DONE");
  const done = rounds.filter((r) => r.status === "DONE");

  return (
    <div className="grid gap-5">
      <div>
        <Link href={`/admin/events/${id}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground">
          <ArrowLeft className="size-4" /> {event.title}
        </Link>
        <h1 className="mt-1 text-xl font-semibold">Match board</h1>
      </div>

      {!open && (
        <Card>
          <CardTitle>Next round: round {(rounds[0]?.number ?? 0) + 1}</CardTitle>
          <p className="mb-3 text-sm text-muted-foreground">
            {players.length} players checked in. Fewest games and longest wait play first, balanced by skill, avoiding repeat
            partners and opponents.
          </p>
          <ActionForm action={generateRoundAction} className="grid-cols-[6rem_1fr] items-end">
            <input type="hidden" name="eventId" value={id} />
            <label className="grid gap-1 text-xs text-muted-foreground">
              Courts
              <Input name="courts" type="number" min={1} defaultValue={event.courtCount} />
            </label>
            <SubmitButton pendingText="Generating…" disabled={players.length < 4}>
              Generate round
            </SubmitButton>
          </ActionForm>
        </Card>
      )}

      {open?.status === "DRAFT" && <DraftRound key={open.id} round={open} players={players} courtCount={event.courtCount} eventId={id} />}
      {open?.status === "PUBLISHED" && <LiveRound round={open} eventId={id} />}

      <section>
        <CardTitle className="mb-2">Checked-in players ({players.length})</CardTitle>
        {players.length === 0 ? (
          <EmptyState>
            Check players in from the <Link href={`/admin/events/${id}`} className="underline">event page</Link>.
          </EmptyState>
        ) : (
          <ul className="grid grid-cols-2 gap-1 text-sm">
            {[...players]
              .sort((a, b) => a.gamesPlayed - b.gamesPlayed || a.name.localeCompare(b.name))
              .map((p) => (
                <li key={p.id} className="flex items-center gap-2 rounded px-2 py-1 odd:bg-muted/50">
                  <SkillDot level={p.skillLevel} />
                  <span className="min-w-0 flex-1 truncate">{p.name}</span>
                  <span className="text-xs text-muted-foreground">{p.gamesPlayed} games</span>
                </li>
              ))}
          </ul>
        )}
      </section>

      {done.map((round) => (
        <section key={round.id}>
          <RoundHeader round={round} />
          <div className="grid gap-2 sm:grid-cols-2">
            {round.matches.map((m) => (
              <MatchCard key={m.id} match={m} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function DraftRound({
  round,
  players,
  courtCount,
  eventId,
}: {
  round: RoundWithMatches;
  players: CheckedIn;
  courtCount: number;
  eventId: string;
}) {
  const courts = Array.from(
    new Set([...round.matches.map((m) => m.courtNumber), ...Array.from({ length: courtCount }, (_, i) => i + 1)]),
  ).sort((a, b) => a - b);
  const playing = new Set(round.matches.flatMap((m) => m.players.map((p) => p.userId)));
  const sittingOut = players.filter((p) => !playing.has(p.id));
  const slot = (court: number, team: "A" | "B", index: number) =>
    round.matches.find((m) => m.courtNumber === court)?.players.filter((p) => p.team === team)[index]?.userId ?? "";

  return (
    <Card className="border-primary">
      <RoundHeader round={round} />
      <p className="mb-3 text-sm text-muted-foreground">
        Review the proposal. Change any player, then save. Clear all four on a court to leave it empty.
      </p>
      <ActionForm action={updateRoundMatchesAction}>
        <input type="hidden" name="eventId" value={eventId} />
        <input type="hidden" name="roundId" value={round.id} />
        <input type="hidden" name="courts" value={courts.join(",")} />
        {courts.map((court) => (
          <fieldset key={court} className="rounded-lg border border-border p-3">
            <legend className="px-1 text-sm font-medium">Court {court}</legend>
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
              <div className="grid gap-1.5">
                {[0, 1].map((i) => (
                  <PlayerSelect key={i} name={`court_${court}_a${i + 1}`} value={slot(court, "A", i)} players={players} />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">vs</span>
              <div className="grid gap-1.5">
                {[0, 1].map((i) => (
                  <PlayerSelect key={i} name={`court_${court}_b${i + 1}`} value={slot(court, "B", i)} players={players} />
                ))}
              </div>
            </div>
          </fieldset>
        ))}
        <SubmitButton variant="secondary" className="justify-self-start">
          Save changes
        </SubmitButton>
      </ActionForm>
      {sittingOut.length > 0 && (
        <p className="mt-3 text-sm text-muted-foreground">
          Sitting out: <span className="text-foreground">{sittingOut.map((p) => p.name).join(", ")}</span>
        </p>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        <ActionForm action={publishRoundAction}>
          <input type="hidden" name="eventId" value={eventId} />
          <input type="hidden" name="roundId" value={round.id} />
          <SubmitButton pendingText="Publishing…">Publish to members</SubmitButton>
        </ActionForm>
        <ActionForm action={deleteDraftRoundAction}>
          <input type="hidden" name="eventId" value={eventId} />
          <input type="hidden" name="roundId" value={round.id} />
          <SubmitButton variant="outline" pendingText="Deleting…">
            Discard and regenerate
          </SubmitButton>
        </ActionForm>
      </div>
    </Card>
  );
}

function PlayerSelect({ name, value, players }: { name: string; value: string; players: CheckedIn }) {
  return (
    <Select name={name} defaultValue={value} aria-label="Player" className="h-9 text-sm">
      <option value="">—</option>
      {players.map((p) => (
        <option key={p.id} value={p.id}>
          {p.name} ({p.skillLevel})
        </option>
      ))}
    </Select>
  );
}

function LiveRound({ round, eventId }: { round: RoundWithMatches; eventId: string }) {
  return (
    <Card className="border-primary">
      <RoundHeader round={round} />
      <div className="grid gap-3">
        {round.matches.map((m) => (
          <div key={m.id} className="grid gap-2">
            <MatchCard match={m} />
            <ActionForm action={recordScoreAction} className="grid-cols-[1fr_1fr_auto] items-end">
              <input type="hidden" name="eventId" value={eventId} />
              <input type="hidden" name="matchId" value={m.id} />
              <Input name="scoreA" type="number" min={0} max={99} defaultValue={m.scoreA ?? ""} placeholder="Left" aria-label="Left team score" />
              <Input name="scoreB" type="number" min={0} max={99} defaultValue={m.scoreB ?? ""} placeholder="Right" aria-label="Right team score" />
              <SubmitButton size="default" variant="outline" pendingText="…">
                Save score
              </SubmitButton>
            </ActionForm>
          </div>
        ))}
      </div>
      <ActionForm action={completeRoundAction} className="mt-4">
        <input type="hidden" name="eventId" value={eventId} />
        <input type="hidden" name="roundId" value={round.id} />
        <SubmitButton pendingText="Finishing…" className="justify-self-start">
          Finish round
        </SubmitButton>
      </ActionForm>
    </Card>
  );
}
