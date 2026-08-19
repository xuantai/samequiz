export interface Category {
  id: number;
  code: string;
  name: string;
  icon: string;
  color: string;
  description: string;
}

export type Difficulty = 'easy' | 'medium' | 'hard' | 'random';

export interface Question {
  id: string;
  country: string;
  categoryIds: number[];
  difficulty: 'easy' | 'medium' | 'hard';
  question: string;
  options: [string, string, string, string];
  correctIndex: number;
  hint: string;
  explanation?: string;
  sourceRef?: string;
}

export interface UserStats {
  totalQuestions: number;
  correctQuestions: number;
  categoryStats: Record<number, { total: number; correct: number }>;
  onlineWins: number;
  onlineLosses: number;
  offlineWins: number;
  offlineLosses: number;
  highestStreak: number;
  totalMatches?: number;
  wins?: number;
  losses?: number;
}

export interface PlayerProfile {
  id: string;
  username: string;
  avatar: string;
  avatarFrame?: string;
  equippedGlow?: boolean;
  title?: string;
  equippedTitle?: string;
  titleColor?: string;
  country: string;
  coins: number;
  elo: number;
  offlineElo: number;
  inventory: string[];
  statsOnline: UserStats;
  statsOffline: UserStats;
  isBanned?: boolean;
  role?: 'player' | 'admin';
}


export interface LifelineState {
  fiftyFifty: boolean;
  hint: boolean;
  removeOne: boolean;
  reduceOpponentTime: boolean;
  addSelfTime: boolean;
}

export interface MatchRules {
  difficulty: Difficulty;
  categoryIds: number[];
  lifelines: {
    fiftyFifty: boolean;
    hint: boolean;
    removeOne: boolean;
    reduceOpponentTime: boolean;
    addSelfTime: boolean;
  };
  totalQuestions: number;
  timePerQuestion: number;
  isHomeAway?: boolean;
  homePlayerId?: string;
  awayPlayerId?: string;
}

export interface PlayerAnswerRecord {
  playerId: string;
  selectedOption: number | null;
  confirmed: boolean;
  answerTimeMs: number;
  isCorrect: boolean;
  pointsEarned: number;
}

export interface RoundResult {
  roundIndex: number;
  question: Question;
  answers: Record<string, PlayerAnswerRecord>;
  roundPoints: Record<string, number>;
  totalScores: Record<string, number>;
}

export interface TournamentMatch {
  id: string;
  roundName: string;
  roundNumber: number;
  matchIndex: number;
  player1: PlayerProfile | null;
  player2: PlayerProfile | null;
  score1: number;
  score2: number;
  winnerId: string | null;
  status: 'waiting' | 'in_progress' | 'completed' | 'bye';
  homePlayerId?: string;
  leg: number;
  nextMatchId?: string;
}

export interface Tournament {
  id: string;
  name: string;
  maxSlots: 4 | 8 | 16 | 32 | 64;
  hostId: string;
  isHostPlaying: boolean;
  rules: MatchRules;
  participants: PlayerProfile[];
  matches: TournamentMatch[];
  currentRound: number;
  status: 'lobby' | 'in_progress' | 'completed';
  winner?: PlayerProfile;
  createdAt: number;
}

export interface GrandEvent {
  id: string;
  title: string;
  description?: string;
  themeCategoryIds: number[];
  scheduledTime: string;
  ticketPrice: number;
  prizePool: number;
  status: 'upcoming' | 'live' | 'finished';
  registeredPlayerCount: number;
  totalRounds: number;
  questions?: Question[];
}

export interface ShopItem {
  id: string;
  name: string;
  category: 'avatar' | 'frame' | 'title' | 'card' | 'ticket' | 'special';
  price: number;
  currency?: 'coin';
  imageOrValue?: string;
  value?: string;
  icon?: string;
  description: string;
  badge?: string;
}


export interface QuestionReport {
  id: string;
  questionId: string;
  questionText: string;
  reporterId: string;
  reporterName: string;
  reason: string;
  timestamp: number;
  status: 'pending' | 'approved' | 'rejected';
  bountyRewarded: number;
}