import crypto from 'crypto';
const uuidv4 = () => crypto.randomUUID();
import questionsData from '../data/questions.json' with { type: 'json' };


export class RoomManager {
  constructor(io) {
    this.io = io;
    this.rooms = new Map(); // roomId -> Room
    this.matchmakingQueue = []; // [{ socketId, profile, rules }]
    this.questions = questionsData;
  }

  createRoom(hostProfile, customRules = {}) {
    const roomId = 'room_' + Math.floor(100000 + Math.random() * 900000);
    const defaultRules = {
      difficulty: 'random',
      categoryIds: [],
      lifelines: {
        fiftyFifty: true,
        hint: true,
        removeOne: true,
        reduceOpponentTime: true,
        addSelfTime: true
      },
      totalQuestions: 10,
      timePerQuestion: 30
    };

    const room = {
      id: roomId,
      hostId: hostProfile.id,
      players: [hostProfile],
      rules: { ...defaultRules, ...customRules },
      status: 'waiting', // 'waiting', 'in_progress', 'finished'
      currentQuestionIndex: 0,
      questions: [],
      scores: { [hostProfile.id]: 0 },
      answers: {}, // { qIndex: { playerId: { option, timeMs, confirmed, isCorrect, points } } }
      lifelineUsage: { [hostProfile.id]: { fiftyFifty: 0, hint: 0, removeOne: 0, reduceOpponentTime: 0, addSelfTime: 0 } },
      questionStartTime: 0,
      timer: null
    };

    this.rooms.set(roomId, room);
    return room;
  }

  joinRoom(roomId, playerProfile) {
    const room = this.rooms.get(roomId);
    if (!room) return { error: 'Phòng không tồn tại' };
    if (room.status !== 'waiting') return { error: 'Trận đấu đang diễn ra' };
    if (room.players.length >= 2) return { error: 'Phòng đã đủ 2 người' };

    room.players.push(playerProfile);
    room.scores[playerProfile.id] = 0;
    room.lifelineUsage[playerProfile.id] = { fiftyFifty: 0, hint: 0, removeOne: 0, reduceOpponentTime: 0, addSelfTime: 0 };
    return { room };
  }

  filterQuestions(rules) {
    let pool = [...this.questions];
    if (rules.categoryIds && rules.categoryIds.length > 0) {
      pool = pool.filter(q => q.categoryIds.some(cId => rules.categoryIds.includes(cId)));
    }
    if (rules.difficulty && rules.difficulty !== 'random') {
      pool = pool.filter(q => q.difficulty === rules.difficulty);
    }
    if (pool.length < rules.totalQuestions) {
      pool = [...this.questions];
    }
    // Shuffle
    pool.sort(() => Math.random() - 0.5);
    return pool.slice(0, rules.totalQuestions);
  }

  startMatch(roomId) {
    const room = this.rooms.get(roomId);
    if (!room || room.players.length < 2) return;

    room.status = 'in_progress';
    room.questions = this.filterQuestions(room.rules);
    room.currentQuestionIndex = 0;
    room.scores = {
      [room.players[0].id]: 0,
      [room.players[1].id]: 0
    };

    this.io.to(roomId).emit('match_started', {
      roomId,
      players: room.players,
      totalQuestions: room.questions.length,
      rules: room.rules
    });

    this.nextQuestion(roomId);
  }

  nextQuestion(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    if (room.currentQuestionIndex >= room.questions.length) {
      this.finishMatch(roomId);
      return;
    }

    const q = room.questions[room.currentQuestionIndex];
    room.answers[room.currentQuestionIndex] = {};
    room.questionStartTime = Date.now();

    // Client receives question without correctIndex to prevent inspect-element cheats
    const sanitizedQuestion = {
      id: q.id,
      country: q.country,
      categoryIds: q.categoryIds,
      difficulty: q.difficulty,
      question: q.question,
      options: q.options,
      hint: q.hint
    };

    this.io.to(roomId).emit('new_question', {
      roundIndex: room.currentQuestionIndex,
      totalRounds: room.questions.length,
      question: sanitizedQuestion,
      timeLimitSeconds: room.rules.timePerQuestion || 30,
      scores: room.scores
    });

    if (room.timer) clearTimeout(room.timer);
    room.timer = setTimeout(() => {
      this.resolveQuestion(roomId);
    }, (room.rules.timePerQuestion || 30) * 1000 + 500); // 30s + grace period
  }

  submitAnswer(roomId, playerId, optionIndex, confirmed) {
    const room = this.rooms.get(roomId);
    if (!room || room.status !== 'in_progress') return;

    const qIndex = room.currentQuestionIndex;
    if (!room.answers[qIndex]) room.answers[qIndex] = {};

    const existing = room.answers[qIndex][playerId];
    if (existing && existing.confirmed && !confirmed) {
      // User cancelled
      existing.confirmed = false;
      this.io.to(roomId).emit('player_selection_updated', {
        playerId,
        hasSelected: true,
        confirmed: false
      });
      return;
    }

    const now = Date.now();
    const timeMs = now - room.questionStartTime;

    room.answers[qIndex][playerId] = {
      playerId,
      selectedOption: optionIndex,
      confirmed: !!confirmed,
      timeMs: Math.max(50, timeMs)
    };

    this.io.to(roomId).emit('player_selection_updated', {
      playerId,
      hasSelected: optionIndex !== null,
      confirmed: !!confirmed
    });

    // Check if both players confirmed
    const p1 = room.players[0].id;
    const p2 = room.players[1].id;
    const ans1 = room.answers[qIndex][p1];
    const ans2 = room.answers[qIndex][p2];

    if (ans1 && ans1.confirmed && ans2 && ans2.confirmed) {
      // Both confirmed early, resolve question immediately!
      if (room.timer) clearTimeout(room.timer);
      this.resolveQuestion(roomId);
    }
  }

  useLifeline(roomId, playerId, lifelineType) {
    const room = this.rooms.get(roomId);
    if (!room || room.status !== 'in_progress') return;

    if (!room.lifelineUsage[playerId]) {
      room.lifelineUsage[playerId] = {};
    }
    if (room.lifelineUsage[playerId][lifelineType] >= 1) return; // Only 1 use per match

    room.lifelineUsage[playerId][lifelineType] = 1;
    const currentQ = room.questions[room.currentQuestionIndex];

    if (lifelineType === 'fiftyFifty') {
      const correct = currentQ.correctIndex;
      const wrongIndices = [0, 1, 2, 3].filter(i => i !== correct);
      wrongIndices.sort(() => Math.random() - 0.5);
      const hiddenIndices = wrongIndices.slice(0, 2);
      this.io.to(playerId).emit('lifeline_result', {
        type: 'fiftyFifty',
        hiddenIndices
      });
    } else if (lifelineType === 'removeOne') {
      const correct = currentQ.correctIndex;
      const wrongIndices = [0, 1, 2, 3].filter(i => i !== correct);
      const removedIndex = wrongIndices[Math.floor(Math.random() * wrongIndices.length)];
      this.io.to(playerId).emit('lifeline_result', {
        type: 'removeOne',
        removedIndex
      });
    } else if (lifelineType === 'hint') {
      this.io.to(playerId).emit('lifeline_result', {
        type: 'hint',
        hint: currentQ.hint
      });
    } else if (lifelineType === 'reduceOpponentTime') {
      // Sabotage: reduce 10s from opponent
      const opponent = room.players.find(p => p.id !== playerId);
      if (opponent) {
        this.io.to(roomId).emit('sabotage_time_event', {
          targetPlayerId: opponent.id,
          sourcePlayerId: playerId,
          seconds: 10
        });
      }
    } else if (lifelineType === 'addSelfTime') {
      this.io.to(roomId).emit('extra_time_event', {
        targetPlayerId: playerId,
        seconds: 10
      });
    }
  }

  resolveQuestion(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const qIndex = room.currentQuestionIndex;
    const q = room.questions[qIndex];
    const answers = room.answers[qIndex] || {};

    const p1 = room.players[0].id;
    const p2 = room.players[1].id;

    const ans1 = answers[p1] || { playerId: p1, selectedOption: null, timeMs: 30000, confirmed: false };
    const ans2 = answers[p2] || { playerId: p2, selectedOption: null, timeMs: 30000, confirmed: false };

    const isCorrect1 = ans1.selectedOption === q.correctIndex;
    const isCorrect2 = ans2.selectedOption === q.correctIndex;

    let points1 = 0;
    let points2 = 0;

    // RULE 3-1-0
    if (isCorrect1 && isCorrect2) {
      if (ans1.timeMs <= ans2.timeMs) {
        points1 = 3;
        points2 = 1;
      } else {
        points1 = 1;
        points2 = 3;
      }
    } else if (isCorrect1 && !isCorrect2) {
      points1 = 3;
      points2 = 0;
    } else if (!isCorrect1 && isCorrect2) {
      points1 = 0;
      points2 = 3;
    } else {
      points1 = 0;
      points2 = 0;
    }

    room.scores[p1] += points1;
    room.scores[p2] += points2;

    this.io.to(roomId).emit('round_result', {
      roundIndex: qIndex,
      correctIndex: q.correctIndex,
      explanation: q.explanation,
      roundPoints: { [p1]: points1, [p2]: points2 },
      totalScores: room.scores,
      playerAnswers: {
        [p1]: { option: ans1.selectedOption, timeMs: ans1.timeMs, isCorrect: isCorrect1, points: points1 },
        [p2]: { option: ans2.selectedOption, timeMs: ans2.timeMs, isCorrect: isCorrect2, points: points2 }
      }
    });

    room.currentQuestionIndex++;
    setTimeout(() => {
      this.nextQuestion(roomId);
    }, 4000); // 4 seconds review
  }

  finishMatch(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    room.status = 'finished';
    const p1 = room.players[0];
    const p2 = room.players[1];
    const s1 = room.scores[p1.id];
    const s2 = room.scores[p2.id];

    let winnerId = null;
    if (s1 > s2) winnerId = p1.id;
    else if (s2 > s1) winnerId = p2.id;

    this.io.to(roomId).emit('match_finished', {
      players: room.players,
      scores: room.scores,
      winnerId,
      isDraw: s1 === s2
    });
  }
}
