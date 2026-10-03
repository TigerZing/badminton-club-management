import { prisma, type Prisma } from "@club/db";
import { generateRound, type PastMatch, type Player } from "@club/matchmaking";
import { UserError } from "../errors";

/** How much a repeat pairing from an earlier event counts, compared with one from tonight. */
const PAST_EVENT_WEIGHT = 0.25;
const PAST_EVENTS_CONSIDERED = 4;

const matchInclude = {
  players: { include: { user: { select: { id: true, name: true, skillLevel: true } } } },
} satisfies Prisma.MatchInclude;

const roundInclude = {
  matches: { orderBy: { courtNumber: "asc" }, include: matchInclude },
} satisfies Prisma.RoundInclude;

export type RoundWithMatches = Prisma.RoundGetPayload<{ include: typeof roundInclude }>;

function toPastMatch(players: { userId: string; team: "A" | "B" }[], weight: number): PastMatch | null {
  const a = players.filter((p) => p.team === "A").map((p) => p.userId);
  const b = players.filter((p) => p.team === "B").map((p) => p.userId);
  if (a.length !== 2 || b.length !== 2) return null;
  return { teamA: [a[0]!, a[1]!], teamB: [b[0]!, b[1]!], weight };
}

/** Checked-in players with how many games they have played tonight and when they last played. */
export async function getCheckedInPlayers(eventId: string) {
  const [regs, rounds] = await Promise.all([
    prisma.registration.findMany({
      where: { eventId, status: "CONFIRMED", checkedInAt: { not: null } },
      include: { user: { select: { id: true, name: true, skillLevel: true } } },
      orderBy: { checkedInAt: "asc" },
    }),
    prisma.round.findMany({
      where: { eventId, status: { in: ["PUBLISHED", "DONE"] } },
      include: { matches: { where: { status: { not: "CANCELLED" } }, include: { players: true } } },
    }),
  ]);

  return regs.map((r) => {
    let gamesPlayed = 0;
    let lastRound: number | null = null;
    for (const round of rounds) {
      if (round.matches.some((m) => m.players.some((p) => p.userId === r.userId))) {
        gamesPlayed++;
        lastRound = Math.max(lastRound ?? 0, round.number);
      }
    }
    return { ...r.user, gamesPlayed, lastRound };
  });
}

async function buildHistory(eventId: string, startsAt: Date, playerIds: string[]): Promise<PastMatch[]> {
  const tonight = await prisma.matchPlayer.findMany({
    where: { match: { status: { not: "CANCELLED" }, round: { eventId, status: { in: ["PUBLISHED", "DONE"] } } } },
  });
  const pastEvents = await prisma.event.findMany({
    where: { startsAt: { lt: startsAt }, rounds: { some: {} } },
    orderBy: { startsAt: "desc" },
    take: PAST_EVENTS_CONSIDERED,
    select: { id: true },
  });
  const earlier = await prisma.matchPlayer.findMany({
    where: {
      match: {
        status: { not: "CANCELLED" },
        round: { eventId: { in: pastEvents.map((e) => e.id) }, status: { in: ["PUBLISHED", "DONE"] } },
        players: { some: { userId: { in: playerIds } } },
      },
    },
  });

  const group = (rows: { matchId: string; userId: string; team: "A" | "B" }[], weight: number) => {
    const byMatch = new Map<string, { userId: string; team: "A" | "B" }[]>();
    for (const r of rows) byMatch.set(r.matchId, [...(byMatch.get(r.matchId) ?? []), r]);
    return [...byMatch.values()].map((p) => toPastMatch(p, weight)).filter((m): m is PastMatch => m !== null);
  };
  return [...group(tonight, 1), ...group(earlier, PAST_EVENT_WEIGHT)];
}

async function assertNoOpenRound(eventId: string) {
  const open = await prisma.round.findFirst({ where: { eventId, status: { in: ["DRAFT", "PUBLISHED"] } } });
  if (open) throw new UserError("errors.roundStillOpen", { number: open.number });
}

export async function generateRoundForEvent(eventId: string, courts?: number) {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) throw new UserError("errors.eventNotFound");
  if (event.status === "COMPLETED" || event.status === "CANCELLED") throw new UserError("errors.eventOver");
  await assertNoOpenRound(eventId);

  const checkedIn = await getCheckedInPlayers(eventId);
  if (checkedIn.length < 4) throw new UserError("errors.needFourCheckedIn");

  const players: Player[] = checkedIn.map((p) => ({
    id: p.id,
    skill: p.skillLevel,
    gamesPlayed: p.gamesPlayed,
    lastRound: p.lastRound,
  }));
  const history = await buildHistory(eventId, event.startsAt, players.map((p) => p.id));
  const proposal = generateRound({
    players,
    history,
    courts: courts ?? event.courtCount,
    seed: Date.now() % 2_147_483_647,
  });

  const last = await prisma.round.findFirst({ where: { eventId }, orderBy: { number: "desc" } });
  const round = await prisma.round.create({
    data: {
      eventId,
      number: (last?.number ?? 0) + 1,
      matches: {
        create: proposal.matches.map((m) => ({
          courtNumber: m.court,
          players: {
            create: [
              ...m.teamA.map((p) => ({ userId: p.id, team: "A" as const, skillAtTime: p.skill })),
              ...m.teamB.map((p) => ({ userId: p.id, team: "B" as const, skillAtTime: p.skill })),
            ],
          },
        })),
      },
    },
  });
  if (event.status === "OPEN" || event.status === "CLOSED") {
    await prisma.event.update({ where: { id: eventId }, data: { status: "IN_PROGRESS" } });
  }
  return round;
}

export interface MatchEdit {
  court: number;
  teamA: [string, string];
  teamB: [string, string];
}

/** Admin: replaces the players on a draft round. A court left fully empty is dropped. */
export async function updateRoundMatches(roundId: string, edits: MatchEdit[]) {
  const round = await prisma.round.findUnique({ where: { id: roundId }, include: roundInclude });
  if (!round) throw new UserError("errors.roundNotFound");
  if (round.status !== "DRAFT") throw new UserError("errors.onlyDraftEdit");

  const ids = edits.flatMap((e) => [...e.teamA, ...e.teamB]);
  if (new Set(ids).size !== ids.length) throw new UserError("errors.onePlayerOneCourt");

  const checkedIn = await getCheckedInPlayers(round.eventId);
  const byId = new Map(checkedIn.map((p) => [p.id, p]));
  for (const id of ids) if (!byId.has(id)) throw new UserError("errors.playersMustBeCheckedIn");

  const key = (a: string[], b: string[]) => [a.sort().join(","), b.sort().join(",")].sort().join("|");
  const before = new Map(
    round.matches.map((m) => [
      m.courtNumber,
      key(
        m.players.filter((p) => p.team === "A").map((p) => p.userId),
        m.players.filter((p) => p.team === "B").map((p) => p.userId),
      ),
    ]),
  );

  await prisma.$transaction([
    prisma.match.deleteMany({ where: { roundId } }),
    ...edits.map((e) =>
      prisma.match.create({
        data: {
          roundId,
          courtNumber: e.court,
          editedByAdmin: before.get(e.court) !== key([...e.teamA], [...e.teamB]),
          players: {
            create: [
              ...e.teamA.map((id) => ({ userId: id, team: "A" as const, skillAtTime: byId.get(id)!.skillLevel })),
              ...e.teamB.map((id) => ({ userId: id, team: "B" as const, skillAtTime: byId.get(id)!.skillLevel })),
            ],
          },
        },
      }),
    ),
  ]);
}

async function getRound(roundId: string) {
  const round = await prisma.round.findUnique({ where: { id: roundId } });
  if (!round) throw new UserError("errors.roundNotFound");
  return round;
}

export async function publishRound(roundId: string) {
  const round = await getRound(roundId);
  if (round.status !== "DRAFT") throw new UserError("errors.onlyDraftPublish");
  await prisma.round.update({ where: { id: roundId }, data: { status: "PUBLISHED" } });
}

export async function completeRound(roundId: string) {
  const round = await getRound(roundId);
  if (round.status !== "PUBLISHED") throw new UserError("errors.publishBeforeFinish");
  await prisma.$transaction([
    prisma.match.updateMany({ where: { roundId, status: "SCHEDULED" }, data: { status: "DONE" } }),
    prisma.round.update({ where: { id: roundId }, data: { status: "DONE" } }),
  ]);
}

export async function deleteDraftRound(roundId: string) {
  const round = await getRound(roundId);
  if (round.status !== "DRAFT") throw new UserError("errors.onlyDraftDelete");
  await prisma.round.delete({ where: { id: roundId } });
}

export async function recordScore(matchId: string, scoreA: number, scoreB: number) {
  const match = await prisma.match.findUnique({ where: { id: matchId }, include: { round: true } });
  if (!match) throw new UserError("errors.matchNotFound");
  if (match.round.status === "DRAFT") throw new UserError("errors.publishBeforeScores");
  await prisma.match.update({ where: { id: matchId }, data: { scoreA, scoreB, status: "DONE" } });
}

export function listRounds(eventId: string, { includeDrafts }: { includeDrafts: boolean }) {
  return prisma.round.findMany({
    where: { eventId, ...(includeDrafts ? {} : { status: { in: ["PUBLISHED", "DONE"] } }) },
    orderBy: { number: "desc" },
    include: roundInclude,
  });
}

/** A member's matches from published rounds, newest first. */
export function getMatchHistory(userId: string) {
  return prisma.match.findMany({
    where: { players: { some: { userId } }, status: { not: "CANCELLED" }, round: { status: { in: ["PUBLISHED", "DONE"] } } },
    include: { ...matchInclude, round: { include: { event: { include: { venue: true } } } } },
    orderBy: [{ round: { event: { startsAt: "desc" } } }, { round: { number: "desc" } }],
    take: 100,
  });
}
