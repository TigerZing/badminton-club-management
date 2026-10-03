export interface Player {
  id: string;
  skill: number;
  /** Games already played at this event. */
  gamesPlayed: number;
  /** Number of the last round this player played tonight, or null if none yet. */
  lastRound: number | null;
}

export interface PastMatch {
  teamA: [string, string];
  teamB: [string, string];
  /** How much a repeat of this match's pairings should count. 1 = tonight, smaller = older. */
  weight: number;
}

export interface Weights {
  /** Difference between the two teams' summed skill. */
  teamBalance: number;
  /** Gap between the strongest and weakest player on the court. */
  skillSpread: number;
  /** Each repeated teammate pair. */
  repeatTeammate: number;
  /** Each repeated opponent pair. */
  repeatOpponent: number;
}

export interface GenerateOptions {
  players: Player[];
  history: PastMatch[];
  courts: number;
  seed?: number;
  weights?: Partial<Weights>;
  iterations?: number;
}

export interface CostBreakdown {
  teamBalance: number;
  skillSpread: number;
  repeatTeammate: number;
  repeatOpponent: number;
  total: number;
}

export interface ProposedMatch {
  court: number;
  teamA: [Player, Player];
  teamB: [Player, Player];
  cost: CostBreakdown;
}

export interface RoundProposal {
  matches: ProposedMatch[];
  sittingOut: Player[];
  totalCost: number;
}
