import { PlayerProfile, UserStats, ShopItem, QuestionReport } from '../types/game';
import { CATEGORIES } from '../data/categories';

const PROFILE_KEY = 'samequiz_player_profile';
const OFFLINE_LEADERBOARD_KEY = 'samequiz_offline_lb';
const REPORTS_KEY = 'samequiz_reports';

const defaultStats: UserStats = {
  totalQuestions: 0,
  correctQuestions: 0,
  categoryStats: {},
  onlineWins: 0,
  onlineLosses: 0,
  offlineWins: 0,
  offlineLosses: 0,
  highestStreak: 0
};

// Initialize categories stats
CATEGORIES.forEach(c => {
  defaultStats.categoryStats[c.id] = { total: 0, correct: 0 };
});

const defaultProfile: PlayerProfile = {
  id: 'usr_' + Math.random().toString(36).substring(2, 9),
  username: 'Đại Hiệp Trí Tuệ',
  avatar: '🧠',
  country: 'VN',
  coins: 1200,
  elo: 1200,
  offlineElo: 1200,
  inventory: ['item_frame_neon'],
  avatarFrame: 'border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.6)]',
  statsOnline: JSON.parse(JSON.stringify(defaultStats)),
  statsOffline: JSON.parse(JSON.stringify(defaultStats)),
  role: 'player'
};

export const getProfile = (): PlayerProfile => {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(defaultProfile));
      return defaultProfile;
    }
    const parsed = JSON.parse(raw);
    // Ensure all category IDs exist
    CATEGORIES.forEach(c => {
      if (!parsed.statsOnline.categoryStats[c.id]) parsed.statsOnline.categoryStats[c.id] = { total: 0, correct: 0 };
      if (!parsed.statsOffline.categoryStats[c.id]) parsed.statsOffline.categoryStats[c.id] = { total: 0, correct: 0 };
    });
    return parsed;
  } catch (e) {
    return defaultProfile;
  }
};

export const saveProfile = (profile: PlayerProfile) => {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
};

// Public Radar Analysis: Calculate Strengths and Weaknesses
export interface CategoryProficiency {
  categoryId: number;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  total: number;
  correct: number;
  winRate: number; // 0 - 100%
}

export const getCategoryProficiencies = (stats: UserStats): CategoryProficiency[] => {
  return CATEGORIES.map(cat => {
    const s = stats.categoryStats[cat.id] || { total: 0, correct: 0 };
    const winRate = s.total > 0 ? Math.round((s.correct / s.total) * 100) : 50; // default 50% if unplayed
    return {
      categoryId: cat.id,
      categoryName: cat.name,
      categoryIcon: cat.icon,
      categoryColor: cat.color,
      total: s.total,
      correct: s.correct,
      winRate
    };
  });
};

// ELO Calculation Formula
export const calculateEloDelta = (playerElo: number, opponentElo: number, result: 1 | 0 | 0.5, kFactor: number = 32): number => {
  const expectedScore = 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));
  const delta = Math.round(kFactor * (result - expectedScore));
  return delta;
};

// Update Match Results into Profile
export const recordMatchResult = (
  isOnline: boolean,
  isWin: boolean,
  answeredQuestions: { categoryIds: number[]; isCorrect: boolean }[],
  opponentElo: number = 1200
): { eloDelta: number; coinReward: number } => {
  const profile = getProfile();
  const stats = isOnline ? profile.statsOnline : profile.statsOffline;

  // ELO math
  const resultScore = isWin ? 1 : 0;
  const currentElo = isOnline ? profile.elo : profile.offlineElo;
  const eloDelta = calculateEloDelta(currentElo, opponentElo, resultScore);

  if (isOnline) {
    profile.elo = Math.max(100, profile.elo + eloDelta);
    if (isWin) profile.statsOnline.onlineWins++;
    else profile.statsOnline.onlineLosses++;
  } else {
    profile.offlineElo = Math.max(100, profile.offlineElo + eloDelta);
    if (isWin) profile.statsOffline.offlineWins++;
    else profile.statsOffline.offlineLosses++;
  }

  // Update question stats
  answeredQuestions.forEach(q => {
    stats.totalQuestions++;
    if (q.isCorrect) stats.correctQuestions++;

    q.categoryIds.forEach(catId => {
      if (!stats.categoryStats[catId]) {
        stats.categoryStats[catId] = { total: 0, correct: 0 };
      }
      stats.categoryStats[catId].total++;
      if (q.isCorrect) {
        stats.categoryStats[catId].correct++;
      }
    });
  });

  // Coin reward: +100 for win, +30 for play
  const coinReward = isWin ? 150 : 40;
  profile.coins += coinReward;

  saveProfile(profile);
  return { eloDelta, coinReward };
};

// Fact Hunter Reports
export const submitQuestionReport = (questionId: string, questionText: string, reason: string): QuestionReport => {
  const profile = getProfile();
  const report: QuestionReport = {
    id: 'rep_' + Date.now(),
    questionId,
    questionText,
    reporterId: profile.id,
    reporterName: profile.username,
    reason,
    timestamp: Date.now(),
    status: 'pending',
    bountyRewarded: 500
  };

  const reports = getReports();
  reports.unshift(report);
  localStorage.setItem(REPORTS_KEY, JSON.stringify(reports));
  return report;
};

export const getReports = (): QuestionReport[] => {
  try {
    const raw = localStorage.getItem(REPORTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

export const getPlayerProfile = getProfile;

export const updatePlayerProfile = (updates: Partial<PlayerProfile>): PlayerProfile => {
  const current = getProfile();
  const updated = { ...current, ...updates };
  saveProfile(updated);
  return updated;
};

export const saveMatchResult = (result: any, isOnline: boolean = true): PlayerProfile => {
  const isWin = result.winnerId === result.player1.id;
  recordMatchResult(isOnline, isWin, result.questions || [], result.player2?.elo || 1200);
  return getProfile();
};

