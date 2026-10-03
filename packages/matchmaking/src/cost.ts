import type { CostBreakdown, PastMatch, Player, Weights } from "./types";

export const DEFAULT_WEIGHTS: Weights = {
  teamBalance: 10,
  skillSpread: 2,
  repeatTeammate: 30,
  repeatOpponent: 6,
};

const key = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);

export interface PairHistory {
  teammates: Map<string, number>;
  opponents: Map<string, number>;
}

export function buildPairHistory(history: PastMatch[]): PairHistory {
  const teammates = new Map<string, number>();
  const opponents = new Map<string, number>();
  const add = (map: Map<string, number>, a: string, b: string, w: number) =>
    map.set(key(a, b), (map.get(key(a, b)) ?? 0) + w);

  for (const m of history) {
    add(teammates, m.teamA[0], m.teamA[1], m.weight);
    add(teammates, m.teamB[0], m.teamB[1], m.weight);
    for (const a of m.teamA) for (const b of m.teamB) add(opponents, a, b, m.weight);
  }
  return { teammates, opponents };
}

export function matchCost(
  teamA: [Player, Player],
  teamB: [Player, Player],
  pairs: PairHistory,
  weights: Weights,
): CostBreakdown {
  const sumA = teamA[0].skill + teamA[1].skill;
  const sumB = teamB[0].skill + teamB[1].skill;
  const skills = [...teamA, ...teamB].map((p) => p.skill);

  const tm = (x: Player, y: Player) => pairs.teammates.get(key(x.id, y.id)) ?? 0;
  const op = (x: Player, y: Player) => pairs.opponents.get(key(x.id, y.id)) ?? 0;

  const teamBalance = weights.teamBalance * Math.abs(sumA - sumB);
  const skillSpread = weights.skillSpread * (Math.max(...skills) - Math.min(...skills));
  const repeatTeammate = weights.repeatTeammate * (tm(teamA[0], teamA[1]) + tm(teamB[0], teamB[1]));
  let opp = 0;
  for (const a of teamA) for (const b of teamB) opp += op(a, b);
  const repeatOpponent = weights.repeatOpponent * opp;

  return {
    teamBalance,
    skillSpread,
    repeatTeammate,
    repeatOpponent,
    total: teamBalance + skillSpread + repeatTeammate + repeatOpponent,
  };
}

/** Tries the three ways to split four players into two teams and returns the cheapest. */
export function bestSplit(four: Player[], pairs: PairHistory, weights: Weights) {
  const [p0, p1, p2, p3] = four as [Player, Player, Player, Player];
  const options: [[Player, Player], [Player, Player]][] = [
    [[p0, p1], [p2, p3]],
    [[p0, p2], [p1, p3]],
    [[p0, p3], [p1, p2]],
  ];
  let best = { teamA: options[0]![0], teamB: options[0]![1], cost: matchCost(options[0]![0], options[0]![1], pairs, weights) };
  for (const [teamA, teamB] of options.slice(1)) {
    const cost = matchCost(teamA, teamB, pairs, weights);
    if (cost.total < best.cost.total) best = { teamA, teamB, cost };
  }
  return best;
}
