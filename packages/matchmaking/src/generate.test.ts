import { describe, expect, it } from "vitest";
import { generateRound } from "./generate";
import type { PastMatch, Player } from "./types";

const makePlayers = (n: number): Player[] =>
  Array.from({ length: n }, (_, i) => ({ id: `p${i + 1}`, skill: 1 + (i % 10), gamesPlayed: 0, lastRound: null }));

/** Plays a whole club night, feeding each round back in as history. */
function simulateNight(playerCount: number, courts: number, rounds: number) {
  const players = makePlayers(playerCount);
  const history: PastMatch[] = [];
  const teammatePairs = new Map<string, number>();
  for (let r = 1; r <= rounds; r++) {
    const proposal = generateRound({ players, history, courts, seed: r });
    for (const m of proposal.matches) {
      history.push({ teamA: [m.teamA[0].id, m.teamA[1].id], teamB: [m.teamB[0].id, m.teamB[1].id], weight: 1 });
      for (const team of [m.teamA, m.teamB]) {
        const k = [team[0].id, team[1].id].sort().join("|");
        teammatePairs.set(k, (teammatePairs.get(k) ?? 0) + 1);
      }
      for (const p of [...m.teamA, ...m.teamB]) {
        const pl = players.find((x) => x.id === p.id)!;
        pl.gamesPlayed++;
        pl.lastRound = r;
      }
    }
  }
  return { players, teammatePairs };
}

describe("generateRound", () => {
  it("fills every court and uses each player at most once", () => {
    const result = generateRound({ players: makePlayers(18), history: [], courts: 4 });
    expect(result.matches).toHaveLength(4);
    expect(result.sittingOut).toHaveLength(2);
    const ids = result.matches.flatMap((m) => [...m.teamA, ...m.teamB].map((p) => p.id));
    expect(new Set(ids).size).toBe(16);
  });

  it("uses fewer courts when there are not enough players", () => {
    const result = generateRound({ players: makePlayers(9), history: [], courts: 4 });
    expect(result.matches).toHaveLength(2);
    expect(result.sittingOut).toHaveLength(1);
    expect(generateRound({ players: makePlayers(3), history: [], courts: 2 }).matches).toHaveLength(0);
  });

  it("is deterministic for a given seed", () => {
    const a = generateRound({ players: makePlayers(16), history: [], courts: 3, seed: 7 });
    const b = generateRound({ players: makePlayers(16), history: [], courts: 3, seed: 7 });
    expect(a).toEqual(b);
  });

  it("lets players who sat out play next", () => {
    const players = makePlayers(6).map((p, i) => ({ ...p, gamesPlayed: i < 2 ? 0 : 1, lastRound: i < 2 ? null : 1 }));
    const result = generateRound({ players, history: [], courts: 1 });
    const playing = [...result.matches[0]!.teamA, ...result.matches[0]!.teamB].map((p) => p.id);
    expect(playing).toEqual(expect.arrayContaining(["p1", "p2"]));
  });

  it("balances teams by total skill", () => {
    const players: Player[] = [10, 9, 2, 1].map((s, i) => ({ id: `p${i}`, skill: s, gamesPlayed: 0, lastRound: null }));
    const [match] = generateRound({ players, history: [], courts: 1 }).matches;
    const sumA = match!.teamA[0].skill + match!.teamA[1].skill;
    const sumB = match!.teamB[0].skill + match!.teamB[1].skill;
    expect(sumA).toBe(sumB);
  });

  it("avoids repeating last round's partners when it can", () => {
    const players: Player[] = [5, 5, 5, 5].map((s, i) => ({ id: `p${i}`, skill: s, gamesPlayed: 1, lastRound: 1 }));
    const history: PastMatch[] = [{ teamA: ["p0", "p1"], teamB: ["p2", "p3"], weight: 1 }];
    const [match] = generateRound({ players, history, courts: 1 }).matches;
    const pairs = [match!.teamA, match!.teamB].map((t) => t.map((p) => p.id).sort().join("|"));
    expect(pairs).not.toContain("p0|p1");
    expect(pairs).not.toContain("p2|p3");
  });

  it("runs a fair 20-player, 4-court night over 6 rounds", () => {
    const { players, teammatePairs } = simulateNight(20, 4, 6);
    const games = players.map((p) => p.gamesPlayed);
    expect(Math.max(...games) - Math.min(...games)).toBeLessThanOrEqual(1);
    expect(Math.max(...teammatePairs.values())).toBe(1);
  });
});
