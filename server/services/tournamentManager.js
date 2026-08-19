import crypto from 'crypto';
const uuidv4 = () => crypto.randomUUID();
import questionsData from '../data/questions.json' with { type: 'json' };


export class TournamentManager {
  constructor(io) {
    this.io = io;
    this.tournaments = new Map();
    this.questions = questionsData;
  }

  createTournament(hostProfile, config = {}) {
    const tournamentId = 'tour_' + Math.floor(100000 + Math.random() * 900000);
    const tournament = {
      id: tournamentId,
      name: config.name || 'Đại Hội Tranh Tài SameQuiz',
      maxSlots: config.maxSlots || 8,
      hostId: hostProfile.id,
      isHostPlaying: config.isHostPlaying ?? true,
      rules: {
        difficulty: config.difficulty || 'random',
        categoryIds: config.categoryIds || [],
        isHomeAway: config.isHomeAway ?? true,
        lifelines: config.lifelines || { fiftyFifty: true, hint: true, removeOne: true, reduceOpponentTime: true, addSelfTime: true },
        totalQuestions: 10,
        timePerQuestion: 30
      },
      participants: config.isHostPlaying ? [hostProfile] : [],
      matches: [],
      currentRound: 1,
      status: 'lobby', // 'lobby', 'in_progress', 'completed'
      createdAt: Date.now()
    };

    this.tournaments.set(tournamentId, tournament);
    return tournament;
  }

  joinTournament(tournamentId, playerProfile) {
    const tour = this.tournaments.get(tournamentId);
    if (!tour) return { error: 'Giải đấu không tồn tại' };
    if (tour.status !== 'lobby') return { error: 'Giải đấu đã khởi tranh' };
    if (tour.participants.length >= tour.maxSlots) return { error: 'Giải đấu đã đầy' };
    if (tour.participants.some(p => p.id === playerProfile.id)) return { error: 'Đã tham gia giải' };

    tour.participants.push(playerProfile);
    return { tournament: tour };
  }

  startTournament(tournamentId) {
    const tour = this.tournaments.get(tournamentId);
    if (!tour || tour.participants.length < 2) return { error: 'Cần ít nhất 2 người' };

    const n = tour.participants.length;
    // Calculate smallest power of 2 >= n (4, 8, 16, 32, 64)
    let bracketSize = 4;
    if (n > 32) bracketSize = 64;
    else if (n > 16) bracketSize = 32;
    else if (n > 8) bracketSize = 16;
    else if (n > 4) bracketSize = 8;
    else bracketSize = 4;

    const participants = [...tour.participants].sort(() => Math.random() - 0.5);
    const byesCount = bracketSize - n;

    // Generate matches
    const matches = [];
    const numFirstRoundMatches = bracketSize / 2;

    for (let i = 0; i < numFirstRoundMatches; i++) {
      const p1 = participants[i * 2] || null;
      const p2 = participants[i * 2 + 1] || null;

      const isBye = !p2 && p1;

      matches.push({
        id: 'match_' + tournamentId + '_r1_' + i,
        roundNumber: 1,
        roundName: bracketSize === 4 ? 'Bán kết ' + (i + 1) : bracketSize === 8 ? 'Tứ kết ' + (i + 1) : 'Vòng 1 - Trận ' + (i + 1),
        matchIndex: i,
        player1: p1,
        player2: p2,
        score1: 0,
        score2: 0,
        winnerId: isBye && p1 ? p1.id : null,
        status: isBye ? 'bye' : 'waiting',
        homePlayerId: p1 ? p1.id : undefined,
        leg: 1
      });
    }

    tour.matches = matches;
    tour.status = 'in_progress';
    tour.currentRound = 1;

    this.io.to(tournamentId).emit('tournament_started', { tournament: tour });
    return { tournament: tour };
  }
}
