import { bestSplit, buildPairHistory, DEFAULT_WEIGHTS } from "./cost";
import { createRandom, shuffle } from "./random";
import type { GenerateOptions, Player, ProposedMatch, RoundProposal } from "./types";

/**
 * Picks who plays this round, then groups them into balanced doubles matches.
 *
 * 1. Players with the fewest games tonight play first, then those who have waited longest.
 * 2. Selected players start in groups of similar skill.
 * 3. Random swaps between courts are kept whenever they lower the total cost
 *    (team balance, skill spread, repeated teammates and opponents).
 */
export function generateRound(options: GenerateOptions): RoundProposal {
  const { players, history, courts } = options;
  const weights = { ...DEFAULT_WEIGHTS, ...options.weights };
  const random = createRandom(options.seed ?? 1);
  const iterations = options.iterations ?? 4000;

  const courtsUsed = Math.max(0, Math.min(courts, Math.floor(players.length / 4)));
  if (courtsUsed === 0) return { matches: [], sittingOut: [...players], totalCost: 0 };

  const { playing, sittingOut } = selectPlayers(players, courtsUsed * 4, random);
  const pairs = buildPairHistory(history);

  // Start from groups of similar skill: strongest four together, next four, and so on.
  const bySkill = [...playing].sort((a, b) => b.skill - a.skill);
  let groups: Player[][] = [];
  for (let i = 0; i < courtsUsed; i++) groups.push(bySkill.slice(i * 4, i * 4 + 4));

  const groupCost = (g: Player[]) => bestSplit(g, pairs, weights).cost.total;
  let costs = groups.map(groupCost);

  for (let i = 0; i < iterations && courtsUsed > 1; i++) {
    const g1 = Math.floor(random() * courtsUsed);
    let g2 = Math.floor(random() * (courtsUsed - 1));
    if (g2 >= g1) g2++;
    const i1 = Math.floor(random() * 4);
    const i2 = Math.floor(random() * 4);

    const a = [...groups[g1]!];
    const b = [...groups[g2]!];
    [a[i1], b[i2]] = [b[i2]!, a[i1]!];
    const ca = groupCost(a);
    const cb = groupCost(b);
    if (ca + cb < costs[g1]! + costs[g2]!) {
      groups = groups.map((g, idx) => (idx === g1 ? a : idx === g2 ? b : g));
      costs = costs.map((c, idx) => (idx === g1 ? ca : idx === g2 ? cb : c));
    }
  }

  // Strongest court first so court numbers are stable and predictable.
  groups.sort((x, y) => sum(y) - sum(x));
  const matches: ProposedMatch[] = groups.map((g, idx) => {
    const { teamA, teamB, cost } = bestSplit(g, pairs, weights);
    return { court: idx + 1, teamA, teamB, cost };
  });

  return {
    matches,
    sittingOut,
    totalCost: matches.reduce((t, m) => t + m.cost.total, 0),
  };
}

function selectPlayers(players: Player[], slots: number, random: () => number) {
  // Shuffle first so ties are broken randomly but reproducibly.
  const ranked = shuffle(players, random).sort((a, b) => {
    if (a.gamesPlayed !== b.gamesPlayed) return a.gamesPlayed - b.gamesPlayed;
    return (a.lastRound ?? -1) - (b.lastRound ?? -1);
  });
  return { playing: ranked.slice(0, slots), sittingOut: ranked.slice(slots) };
}

const sum = (g: Player[]) => g.reduce((t, p) => t + p.skill, 0);
