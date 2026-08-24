import React, { useState, useEffect, useRef } from 'react';
import { 
  Clock, Mic, MicOff, Volume2, VolumeX, Shield, Sparkles, Zap, 
  HelpCircle, Target, ArrowRight, Flag, Flame, Check, AlertCircle, 
  ThumbsUp, MessageSquare, Award, RefreshCw 
} from 'lucide-react';
import { Question, PlayerProfile, LifelineState, MatchRules } from '../types/game';
import { CATEGORIES } from '../data/categories';
import { soundEngine } from '../services/soundEngine';
import { recordMatchResult, submitQuestionReport } from '../services/storageService';
import { getSocket } from '../services/socketService';
import { ResultModal } from './ResultModal';

interface DuelArenaProps {
  myProfile: PlayerProfile;
  opponentProfile: PlayerProfile;
  questions: Question[];
  rules: MatchRules;
  isOnline: boolean;
  onExit: () => void;
}

export const DuelArena: React.FC<DuelArenaProps> = ({
  myProfile,
  opponentProfile,
  questions,
  rules,
  isOnline,
  onExit
}) => {
  const defaultTime = rules.timePerQuestion || 20;
  const [currentRound, setCurrentRound] = useState(0);
  const [timeLeft, setTimeLeft] = useState(defaultTime);
  const [mySelectedOption, setMySelectedOption] = useState<number | null>(null);
  const [myConfirmed, setMyConfirmed] = useState(false);
  const [myConfirmTime, setMyConfirmTime] = useState<number | null>(null);

  // Opponent state
  const [opponentSelectedOption, setOpponentSelectedOption] = useState<number | null>(null);
  const [opponentConfirmed, setOpponentConfirmed] = useState(false);
  const [opponentConfirmTime, setOpponentConfirmTime] = useState<number | null>(null);

  // Scores
  const [myScore, setMyScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [myStreak, setMyStreak] = useState(0);
  const [opponentStreak, setOpponentStreak] = useState(0);

  // Round phase
  const [phase, setPhase] = useState<'question' | 'reveal' | 'finished'>('question');
  const [roundResultDetails, setRoundResultDetails] = useState<{
    myPoints: number;
    oppPoints: number;
    myTimeSec: number;
    oppTimeSec: number;
    isMyCorrect: boolean;
    isOppCorrect: boolean;
  }>({
    myPoints: 0,
    oppPoints: 0,
    myTimeSec: 0,
    oppTimeSec: 0,
    isMyCorrect: false,
    isOppCorrect: false
  });

  // Refs to avoid any stale closures
  const mySelectedOptionRef = useRef<number | null>(null);
  const myConfirmedRef = useRef(false);
  const myConfirmTimeRef = useRef<number | null>(null);
  const opponentSelectedOptionRef = useRef<number | null>(null);
  const opponentConfirmedRef = useRef(false);
  const opponentConfirmTimeRef = useRef<number | null>(null);
  const phaseRef = useRef<'question' | 'reveal' | 'finished'>('question');
  const roundStartTimeRef = useRef(Date.now());

  // Lifelines
  const [lifelinesUsed, setLifelinesUsed] = useState({
    fiftyFifty: false,
    hint: false,
    removeOne: false,
    reduceOpponentTime: false,
    addSelfTime: false
  });
  const [hiddenOptions, setHiddenOptions] = useState<number[]>([]);
  const [showHintModal, setShowHintModal] = useState(false);
  const [sabotageAlert, setSabotageAlert] = useState<string | null>(null);

  // Voice Chat Controls
  const [myMicMuted, setMyMicMuted] = useState(false);
  const [opponentDeafened, setOpponentDeafened] = useState(false);
  const [mySpeaking, setMySpeaking] = useState(false);
  const [opponentSpeaking, setOpponentSpeaking] = useState(false);

  // Result & Match history tracker
  const [matchHistory, setMatchHistory] = useState<{ categoryIds: number[]; isCorrect: boolean }[]>([]);
  const [matchResult, setMatchResult] = useState<{ eloDelta: number; coinReward: number } | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);

  const currentQ = questions[currentRound] || questions[0];
  const category = CATEGORIES.find(c => currentQ?.categoryIds?.includes(c.id)) || CATEGORIES[0];

  // Socket.IO Realtime Answer Syncing
  useEffect(() => {
    if (!rules.roomId) return;
    const socket = getSocket();

    const handleSelectionUpdate = (data: {
      playerId: string;
      hasSelected: boolean;
      optionIndex?: number | null;
      confirmed: boolean;
      timeMs?: number;
    }) => {
      if (data.playerId !== myProfile.id) {
        setOpponentSelectedOption(data.hasSelected ? (data.optionIndex ?? 0) : null);
        opponentSelectedOptionRef.current = data.hasSelected ? (data.optionIndex ?? 0) : null;
        setOpponentConfirmed(data.confirmed);
        opponentConfirmedRef.current = data.confirmed;

        if (data.confirmed) {
          const oppTime = data.timeMs || (Date.now() - roundStartTimeRef.current);
          setOpponentConfirmTime(oppTime);
          opponentConfirmTimeRef.current = oppTime;

          // If user already confirmed on this device, resolve round right away!
          if (myConfirmedRef.current) {
            setTimeout(() => {
              evaluateRound(
                mySelectedOptionRef.current,
                myConfirmTimeRef.current || 5000,
                opponentSelectedOptionRef.current,
                oppTime
              );
            }, 300);
          }
        }
      }
    };

    const handleSabotageTime = (data: { targetPlayerId: string; seconds: number }) => {
      if (data.targetPlayerId === myProfile.id) {
        setTimeLeft(prev => Math.max(1, prev - data.seconds));
        setSabotageAlert('⚡ Bạn bị đối thủ trừ 10s!');
        setTimeout(() => setSabotageAlert(null), 2500);
      }
    };

    const handleExtraTime = (data: { targetPlayerId: string; seconds: number }) => {
      if (data.targetPlayerId === myProfile.id) {
        setTimeLeft(prev => prev + data.seconds);
        setSabotageAlert('⏰ Bạn được cộng thêm +10s thời gian!');
        setTimeout(() => setSabotageAlert(null), 2500);
      }
    };

    socket.on('player_selection_updated', handleSelectionUpdate);
    socket.on('sabotage_time_event', handleSabotageTime);
    socket.on('extra_time_event', handleExtraTime);

    return () => {
      socket.off('player_selection_updated', handleSelectionUpdate);
      socket.off('sabotage_time_event', handleSabotageTime);
      socket.off('extra_time_event', handleExtraTime);
    };
  }, [rules.roomId, myProfile.id, currentRound]);

  // Reset question round
  useEffect(() => {
    if (currentRound >= questions.length) {
      handleMatchEnd();
      return;
    }

    const t = rules.timePerQuestion || 20;
    setTimeLeft(t);
    setMySelectedOption(null);
    mySelectedOptionRef.current = null;
    setMyConfirmed(false);
    myConfirmedRef.current = false;
    setMyConfirmTime(null);
    myConfirmTimeRef.current = null;

    setOpponentSelectedOption(null);
    opponentSelectedOptionRef.current = null;
    setOpponentConfirmed(false);
    opponentConfirmedRef.current = false;
    setOpponentConfirmTime(null);
    opponentConfirmTimeRef.current = null;

    setHiddenOptions([]);
    setShowHintModal(false);
    setPhase('question');
    phaseRef.current = 'question';
    roundStartTimeRef.current = Date.now();
  }, [currentRound]);

  // Main 20s Countdown Timer
  useEffect(() => {
    if (phase !== 'question') return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleTimeExpire();
          return 0;
        }

        if (prev <= 5) {
          soundEngine.playUrgentTick();
        } else {
          soundEngine.playTick();
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase, currentRound]);

  // Option selection
  const handleSelectOption = (idx: number) => {
    if (myConfirmed || phase !== 'question' || hiddenOptions.includes(idx)) return;
    soundEngine.playSelect();
    setMySelectedOption(idx);
    mySelectedOptionRef.current = idx;

    if (rules.roomId) {
      getSocket().emit('submit_answer', {
        roomId: rules.roomId,
        playerId: myProfile.id,
        optionIndex: idx,
        confirmed: false
      });
    }
  };

  // Confirm Option
  const handleConfirmOption = () => {
    if (mySelectedOption === null || myConfirmed || phase !== 'question') return;
    soundEngine.playConfirm();
    setMyConfirmed(true);
    myConfirmedRef.current = true;
    const elapsed = Date.now() - roundStartTimeRef.current;
    setMyConfirmTime(elapsed);
    myConfirmTimeRef.current = elapsed;

    if (rules.roomId) {
      getSocket().emit('submit_answer', {
        roomId: rules.roomId,
        playerId: myProfile.id,
        optionIndex: mySelectedOption,
        confirmed: true,
        timeMs: elapsed
      });
    }

    // If opponent already confirmed, resolve round right away
    if (opponentConfirmedRef.current) {
      setTimeout(() => {
        evaluateRound(
          mySelectedOption,
          elapsed,
          opponentSelectedOptionRef.current,
          opponentConfirmTimeRef.current || 8000
        );
      }, 300);
    }
  };

  // Cancel/Change Option
  const handleCancelOption = () => {
    if (phase !== 'question') return;
    soundEngine.playSelect();
    setMyConfirmed(false);
    myConfirmedRef.current = false;
    setMyConfirmTime(null);
    myConfirmTimeRef.current = null;

    if (rules.roomId) {
      getSocket().emit('submit_answer', {
        roomId: rules.roomId,
        playerId: myProfile.id,
        optionIndex: mySelectedOption,
        confirmed: false
      });
    }
  };

  // Handle Timeout (20s)
  const handleTimeExpire = () => {
    const finalMyOption = mySelectedOptionRef.current;
    const finalOpponentOption = opponentSelectedOptionRef.current;
    const totalTimeMs = (rules.timePerQuestion || 20) * 1000;
    evaluateRound(
      finalMyOption,
      myConfirmTimeRef.current || totalTimeMs,
      finalOpponentOption,
      opponentConfirmTimeRef.current || totalTimeMs
    );
  };

  // 3-1-0 Scoring Rule Resolution
  const evaluateRound = (
    myOpt: number | null,
    myTime: number,
    oppOpt: number | null,
    oppTime: number
  ) => {
    if (phaseRef.current !== 'question') return;
    setPhase('reveal');
    phaseRef.current = 'reveal';

    const q = questions[currentRound];
    if (!q) return;

    const isMyCorrect = myOpt === q.correctIndex;
    const isOppCorrect = oppOpt === q.correctIndex;

    let myPoints = 0;
    let oppPoints = 0;

    const mySec = Math.max(0.1, Number((myTime / 1000).toFixed(2)));
    const oppSec = Math.max(0.1, Number((oppTime / 1000).toFixed(2)));

    // Accurate 3-1-0 Scoring Rule
    if (isMyCorrect && isOppCorrect) {
      if (myTime <= oppTime) {
        myPoints = 3;
        oppPoints = 1;
      } else {
        myPoints = 1;
        oppPoints = 3;
      }
    } else if (isMyCorrect && !isOppCorrect) {
      myPoints = 3;
      oppPoints = 0;
    } else if (!isMyCorrect && isOppCorrect) {
      myPoints = 0;
      oppPoints = 3;
    } else {
      myPoints = 0;
      oppPoints = 0;
    }

    if (isMyCorrect) {
      soundEngine.playCorrect();
      setMyStreak(prev => prev + 1);
    } else {
      soundEngine.playWrong();
      setMyStreak(0);
    }

    if (isOppCorrect) {
      setOpponentStreak(prev => prev + 1);
    } else {
      setOpponentStreak(0);
    }

    setMyScore(prev => prev + myPoints);
    setOpponentScore(prev => prev + oppPoints);
    setRoundResultDetails({
      myPoints,
      oppPoints,
      myTimeSec: mySec,
      oppTimeSec: oppSec,
      isMyCorrect,
      isOppCorrect
    });

    // Track for profile radar
    setMatchHistory(prev => [...prev, { categoryIds: q.categoryIds, isCorrect: isMyCorrect }]);

    // Move to next question after 3.5s reveal
    setTimeout(() => {
      setCurrentRound(prev => prev + 1);
    }, 3500);
  };

  // Match Finish
  const handleMatchEnd = () => {
    setPhase('finished');
    const isWin = myScore > opponentScore;
    const res = recordMatchResult(isOnline, isWin, matchHistory, opponentProfile.elo);
    setMatchResult(res);
    setShowResultModal(true);
  };

  // === 5 LIFELINES ===
  const useFiftyFifty = () => {
    if (lifelinesUsed.fiftyFifty || phase !== 'question' || !rules.lifelines.fiftyFifty) return;
    soundEngine.playLifeline();
    setLifelinesUsed({ ...lifelinesUsed, fiftyFifty: true });

    const correct = currentQ.correctIndex;
    const wrongs = [0, 1, 2, 3].filter(i => i !== correct);
    wrongs.sort(() => Math.random() - 0.5);
    setHiddenOptions([wrongs[0], wrongs[1]]);
  };

  const useHint = () => {
    if (lifelinesUsed.hint || phase !== 'question' || !rules.lifelines.hint) return;
    soundEngine.playLifeline();
    setLifelinesUsed({ ...lifelinesUsed, hint: true });
    setShowHintModal(true);
  };

  const useRemoveOne = () => {
    if (lifelinesUsed.removeOne || phase !== 'question' || !rules.lifelines.removeOne) return;
    soundEngine.playLifeline();
    setLifelinesUsed({ ...lifelinesUsed, removeOne: true });

    const correct = currentQ.correctIndex;
    const wrongs = [0, 1, 2, 3].filter(i => i !== correct && !hiddenOptions.includes(i));
    if (wrongs.length > 0) {
      setHiddenOptions(prev => [...prev, wrongs[0]]);
    }
  };

  const useReduceOpponentTime = () => {
    if (lifelinesUsed.reduceOpponentTime || phase !== 'question' || !rules.lifelines.reduceOpponentTime) return;
    soundEngine.playLifeline();
    setLifelinesUsed({ ...lifelinesUsed, reduceOpponentTime: true });
    setSabotageAlert('⚡ Bạn đã trừ 10s suy nghĩ của đối thủ!');
    setTimeout(() => setSabotageAlert(null), 2500);

    if (rules.roomId) {
      getSocket().emit('use_lifeline', {
        roomId: rules.roomId,
        lifelineType: 'reduceOpponentTime'
      });
    }
  };

  const useAddSelfTime = () => {
    if (lifelinesUsed.addSelfTime || phase !== 'question' || !rules.lifelines.addSelfTime) return;
    soundEngine.playLifeline();
    setLifelinesUsed({ ...lifelinesUsed, addSelfTime: true });
    setTimeLeft(prev => prev + 10);
    setSabotageAlert('⏰ Bạn được cộng thêm +10s thời gian!');
    setTimeout(() => setSabotageAlert(null), 2500);

    if (rules.roomId) {
      getSocket().emit('use_lifeline', {
        roomId: rules.roomId,
        lifelineType: 'addSelfTime'
      });
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 min-h-[90vh] flex flex-col justify-between animate-fade-in relative">
      {/* Sabotage / Extra Time Pop Alert */}
      {sabotageAlert && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-2 rounded-2xl bg-amber-500 text-slate-950 font-black text-sm shadow-2xl animate-bounce">
          {sabotageAlert}
        </div>
      )}

      {/* TOP ARENA HUD: PLAYER 1 vs PLAYER 2 */}
      <div className="grid grid-cols-12 gap-3 items-center glass-panel rounded-3xl p-4 border border-cyan-500/30 shadow-2xl">
        {/* Left HUD: Player 1 (You) */}
        <div className="col-span-5 flex items-center gap-3">
          <div className="relative">
            <div className={`w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center text-3xl border-2 transition-all ${
              mySpeaking ? 'border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.8)] scale-105' : myProfile.avatarFrame || 'border-cyan-500'
            }`}>
              {myProfile.avatar}
            </div>
            {/* Live audio wave */}
            {mySpeaking && (
              <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className={`text-sm font-extrabold truncate ${myProfile.titleColor || 'text-cyan-300'}`}>
                {myProfile.username}
              </span>
              <span className="text-[10px] px-1 rounded bg-slate-800 text-slate-400 font-mono">
                {myProfile.country}
              </span>
            </div>
            
            {/* Score & Streak */}
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-2xl font-black text-cyan-400 font-mono tracking-tight">
                {myScore} <span className="text-xs font-normal text-slate-400">pts</span>
              </span>
              {myStreak >= 2 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 font-bold border border-orange-500/40 flex items-center gap-0.5">
                  <Flame className="w-3 h-3 fill-current" /> {myStreak}x
                </span>
              )}
            </div>

            {/* Selection Status */}
            <div className="text-[11px] font-semibold mt-0.5">
              {myConfirmed ? (
                <span className="text-emerald-400 font-bold flex items-center gap-1">🔒 Đã chốt đáp án</span>
              ) : mySelectedOption !== null ? (
                <span className="text-amber-400">⏳ Đang tick (chưa chốt)</span>
              ) : (
                <span className="text-slate-400">🤔 Đang suy nghĩ...</span>
              )}
            </div>
          </div>

          {/* Personal Mic Control */}
          <button
            onClick={() => setMyMicMuted(!myMicMuted)}
            className={`p-2 rounded-xl border transition-all ${
              myMicMuted ? 'bg-rose-950/60 border-rose-500/40 text-rose-400' : 'bg-slate-900 border-slate-700 text-cyan-400 hover:border-cyan-400'
            }`}
            title={myMicMuted ? 'Bật Mic của tôi' : 'Tắt Mic của tôi'}
          >
            {myMicMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
        </div>

        {/* Center: 30s Circular Countdown Timer & Round Index */}
        <div className="col-span-2 flex flex-col items-center justify-center">
          <div className="relative w-16 h-16 flex items-center justify-center">
            {/* SVG Timer Ring */}
            <svg className="w-full h-full -rotate-90">
              <circle
                cx="32"
                cy="32"
                r="28"
                className="stroke-slate-800"
                strokeWidth="4"
                fill="transparent"
              />
              <circle
                cx="32"
                cy="32"
                r="28"
                className={`transition-all duration-1000 ${
                  timeLeft <= 5 ? 'stroke-rose-500 animate-pulse' : timeLeft <= 10 ? 'stroke-amber-400' : 'stroke-cyan-400'
                }`}
                strokeWidth="4"
                strokeDasharray="175.9"
                strokeDashoffset={175.9 - (175.9 * timeLeft) / defaultTime}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-xl font-black font-mono leading-none ${
                timeLeft <= 5 ? 'text-rose-400 animate-ping' : timeLeft <= 10 ? 'text-amber-300' : 'text-cyan-300'
              }`}>
                {timeLeft}s
              </span>
            </div>
          </div>
          <span className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">
            Câu {currentRound + 1}/{questions.length}
          </span>
        </div>

        {/* Right HUD: Player 2 (Opponent) */}
        <div className="col-span-5 flex items-center justify-end gap-3 text-right">
          {/* Opponent Mute/Deafen Toggle */}
          <button
            onClick={() => setOpponentDeafened(!opponentDeafened)}
            className={`p-2 rounded-xl border transition-all ${
              opponentDeafened ? 'bg-rose-950/60 border-rose-500/40 text-rose-400' : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
            }`}
            title={opponentDeafened ? 'Bật tiếng đối thủ' : 'Mute tiếng đối thủ (Không muốn nghe)'}
          >
            {opponentDeafened ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-end gap-1.5">
              <span className="text-[10px] px-1 rounded bg-slate-800 text-slate-400 font-mono">
                {opponentProfile.country}
              </span>
              <span className={`text-sm font-extrabold truncate ${opponentProfile.titleColor || 'text-fuchsia-300'}`}>
                {opponentProfile.username}
              </span>
            </div>

            {/* Score & Streak */}
            <div className="flex items-center justify-end gap-2 mt-0.5">
              {opponentStreak >= 2 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 font-bold border border-orange-500/40 flex items-center gap-0.5">
                  <Flame className="w-3 h-3 fill-current" /> {opponentStreak}x
                </span>
              )}
              <span className="text-2xl font-black text-fuchsia-400 font-mono tracking-tight">
                {opponentScore} <span className="text-xs font-normal text-slate-400">pts</span>
              </span>
            </div>

            {/* Opponent Status */}
            <div className="text-[11px] font-semibold mt-0.5">
              {opponentConfirmed ? (
                <span className="text-emerald-400 font-bold">🔒 Đã chốt</span>
              ) : opponentSelectedOption !== null ? (
                <span className="text-amber-400">⏳ Đang tick</span>
              ) : (
                <span className="text-slate-400">🤔 Đang suy nghĩ...</span>
              )}
            </div>
          </div>

          <div className="relative">
            <div className={`w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center text-3xl border-2 transition-all ${
              opponentSpeaking && !opponentDeafened ? 'border-fuchsia-400 shadow-[0_0_20px_rgba(217,70,239,0.8)] scale-105' : opponentProfile.avatarFrame || 'border-fuchsia-500'
            }`}>
              {opponentProfile.avatar}
            </div>
            {opponentSpeaking && !opponentDeafened && (
              <span className="absolute -bottom-1 -left-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-fuchsia-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-fuchsia-500"></span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* QUESTION CARD & CATEGORY BADGE */}
      <div className="my-4 glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 relative overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full bg-gradient-to-r ${category.color} text-white font-black text-xs uppercase tracking-wider flex items-center gap-1 shadow-md`}>
              {category.name}
            </span>
            <span className="text-xs text-slate-400 font-bold uppercase">
              • Độ khó: <strong className="text-cyan-400 uppercase">{currentQ.difficulty}</strong>
            </span>
          </div>

          {/* Fact Hunter Report Button */}
          <button
            onClick={() => setShowHintModal(false)}
            className="text-[11px] font-bold text-slate-400 hover:text-amber-400 flex items-center gap-1"
          >
            <Flag className="w-3 h-3" /> Báo lỗi câu hỏi
          </button>
        </div>

        <h2 className="text-xl sm:text-2xl font-black text-white leading-snug tracking-tight text-center max-w-4xl mx-auto py-2">
          {currentQ.question}
        </h2>
      </div>

      {/* 4 ANSWER CHOICES (A, B, C, D) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-4">
        {currentQ.options.map((optText, idx) => {
          const isSelected = mySelectedOption === idx;
          const isHidden = hiddenOptions.includes(idx);
          const isCorrect = idx === currentQ.correctIndex;
          const isReveal = phase === 'reveal';

          let cardStyle = 'bg-slate-900/80 border-slate-800 text-slate-200 hover:border-cyan-500/50 hover:bg-slate-850';
          let letterBg = 'bg-slate-800 text-slate-300';

          if (isHidden) {
            return (
              <div
                key={idx}
                className="p-4 rounded-2xl border border-slate-900 bg-slate-950/40 opacity-20 pointer-events-none flex items-center gap-3"
              >
                <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center font-bold text-xs">
                  {String.fromCharCode(65 + idx)}
                </div>
                <span className="text-sm font-medium line-through">--- ĐÃ BỎ ---</span>
              </div>
            );
          }

          if (isReveal) {
            if (isCorrect) {
              cardStyle = 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.4)] scale-[1.01]';
              letterBg = 'bg-emerald-500 text-slate-950 font-black';
            } else if (isSelected && !isCorrect) {
              cardStyle = 'bg-rose-500/20 border-rose-500 text-rose-300';
              letterBg = 'bg-rose-500 text-white font-black';
            }
          } else if (isSelected) {
            cardStyle = myConfirmed
              ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 neon-glow-cyan scale-[1.01]'
              : 'bg-cyan-950/40 border-cyan-500/80 text-cyan-300';
            letterBg = 'bg-cyan-500 text-slate-950 font-black';
          }

          return (
            <div
              key={idx}
              onClick={() => handleSelectOption(idx)}
              className={`p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer flex items-center justify-between ${cardStyle}`}
            >
              <div className="flex items-center gap-3.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${letterBg}`}>
                  {String.fromCharCode(65 + idx)}
                </div>
                <span className="text-sm sm:text-base font-bold leading-relaxed">{optText}</span>
              </div>

              {/* Status Indicator on Card */}
              {isSelected && (
                <span className="text-xs font-black px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  {myConfirmed ? 'ĐÃ CHỐT' : 'ĐANG CHỌN'}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* CONFIRMATION & SELECTION ACTION BAR */}
      {phase === 'question' && (
        <div className="flex items-center justify-center gap-3 mb-4">
          {!myConfirmed ? (
            <button
              onClick={handleConfirmOption}
              disabled={mySelectedOption === null}
              className={`px-8 py-3 rounded-2xl font-black text-sm sm:text-base shadow-xl flex items-center gap-2 transition-all ${
                mySelectedOption !== null
                  ? 'bg-gradient-to-r from-cyan-500 to-fuchsia-600 hover:from-cyan-400 hover:to-fuchsia-500 text-slate-950 shadow-cyan-500/30 scale-105 cursor-pointer'
                  : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60'
              }`}
            >
              <Check className="w-5 h-5 stroke-[3]" /> XÁC NHẬN ĐÁP ÁN (CHỐT)
            </button>
          ) : (
            <button
              onClick={handleCancelOption}
              className="px-6 py-2.5 rounded-2xl bg-slate-900 border border-slate-700 hover:border-rose-500 text-slate-300 hover:text-rose-400 font-bold text-xs sm:text-sm flex items-center gap-2 transition-colors"
            >
              <RefreshCw className="w-4 h-4" /> HỦY ĐỂ ĐỔI ĐÁP ÁN KHÁC
            </button>
          )}
        </div>
      )}

      {/* REVEAL PHASE BANNER WITH PRECISE TIMING & BREAKDOWN */}
      {phase === 'reveal' && (
        <div className="mb-4 p-4 sm:p-5 rounded-3xl bg-slate-900/95 border border-cyan-500/40 text-center animate-fade-in space-y-3 shadow-2xl shadow-cyan-500/10">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
            {/* Bạn */}
            <div className={`p-3.5 rounded-2xl border transition-all ${
              roundResultDetails.myPoints === 3
                ? 'bg-emerald-500/15 border-emerald-400 text-emerald-300 shadow-lg shadow-emerald-500/20'
                : roundResultDetails.myPoints === 1
                ? 'bg-cyan-500/15 border-cyan-400 text-cyan-300'
                : 'bg-slate-950/60 border-slate-800 text-slate-400'
            }`}>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Bạn</div>
              <div className="text-2xl font-black font-mono mt-0.5">
                +{roundResultDetails.myPoints} điểm {roundResultDetails.myPoints === 3 && '⚡ (Nhanh Nhất!)'}
              </div>
              <div className="text-xs font-semibold mt-1">
                {roundResultDetails.isMyCorrect ? (
                  <span>
                    ⏱️ Thời gian chốt: <strong className="text-white font-mono">{roundResultDetails.myTimeSec}s</strong>
                    {roundResultDetails.myPoints === 1 && (
                      <span className="text-amber-400 block text-[11px] font-bold mt-0.5">
                        (Đúng nhưng chậm hơn {(roundResultDetails.myTimeSec - roundResultDetails.oppTimeSec).toFixed(2)}s)
                      </span>
                    )}
                  </span>
                ) : (
                  <span className="text-rose-400">❌ Trả lời sai / Hết giờ ({roundResultDetails.myTimeSec}s)</span>
                )}
              </div>
            </div>

            {/* Đối Thủ */}
            <div className={`p-3.5 rounded-2xl border transition-all ${
              roundResultDetails.oppPoints === 3
                ? 'bg-emerald-500/15 border-emerald-400 text-emerald-300 shadow-lg shadow-emerald-500/20'
                : roundResultDetails.oppPoints === 1
                ? 'bg-fuchsia-500/15 border-fuchsia-400 text-fuchsia-300'
                : 'bg-slate-950/60 border-slate-800 text-slate-400'
            }`}>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">{opponentProfile.username}</div>
              <div className="text-2xl font-black font-mono mt-0.5">
                +{roundResultDetails.oppPoints} điểm {roundResultDetails.oppPoints === 3 && '⚡ (Nhanh Nhất!)'}
              </div>
              <div className="text-xs font-semibold mt-1">
                {roundResultDetails.isOppCorrect ? (
                  <span>
                    ⏱️ Thời gian chốt: <strong className="text-white font-mono">{roundResultDetails.oppTimeSec}s</strong>
                    {roundResultDetails.oppPoints === 1 && (
                      <span className="text-amber-400 block text-[11px] font-bold mt-0.5">
                        (Đúng nhưng chậm hơn {(roundResultDetails.oppTimeSec - roundResultDetails.myTimeSec).toFixed(2)}s)
                      </span>
                    )}
                  </span>
                ) : (
                  <span className="text-rose-400">❌ Trả lời sai / Chưa chốt ({roundResultDetails.oppTimeSec}s)</span>
                )}
              </div>
            </div>
          </div>

          {currentQ.explanation && (
            <p className="text-xs text-slate-300 max-w-2xl mx-auto italic bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/80">
              💡 <strong>Giải thích:</strong> {currentQ.explanation}
            </p>
          )}
        </div>
      )}

      {/* 5 STRATEGIC LIFELINES BAR */}
      <div className="glass-panel rounded-2xl p-3 border border-slate-800 flex items-center justify-between gap-2 overflow-x-auto">
        <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider pl-2 hidden sm:inline">
          Trợ Giúp (1 lần/trận):
        </span>

        <div className="flex items-center gap-2 flex-1 justify-around">
          {/* 1. 50:50 */}
          {rules.lifelines.fiftyFifty && (
            <button
              onClick={useFiftyFifty}
              disabled={lifelinesUsed.fiftyFifty || phase !== 'question'}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1 ${
                lifelinesUsed.fiftyFifty
                  ? 'bg-slate-950/40 text-slate-600 border-slate-850 opacity-40 cursor-not-allowed'
                  : 'bg-slate-900 border-slate-700 text-cyan-300 hover:border-cyan-400 hover:scale-105'
              }`}
              title="Loại bỏ 2 đáp án sai"
            >
              🎯 50:50
            </button>
          )}

          {/* 2. Hint */}
          {rules.lifelines.hint && (
            <button
              onClick={useHint}
              disabled={lifelinesUsed.hint || phase !== 'question'}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1 ${
                lifelinesUsed.hint
                  ? 'bg-slate-950/40 text-slate-600 border-slate-850 opacity-40 cursor-not-allowed'
                  : 'bg-slate-900 border-slate-700 text-amber-300 hover:border-amber-400 hover:scale-105'
              }`}
              title="Xem gợi ý câu hỏi"
            >
              💡 Gợi Ý
            </button>
          )}

          {/* 3. Remove One */}
          {rules.lifelines.removeOne && (
            <button
              onClick={useRemoveOne}
              disabled={lifelinesUsed.removeOne || phase !== 'question'}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1 ${
                lifelinesUsed.removeOne
                  ? 'bg-slate-950/40 text-slate-600 border-slate-850 opacity-40 cursor-not-allowed'
                  : 'bg-slate-900 border-slate-700 text-rose-300 hover:border-rose-400 hover:scale-105'
              }`}
              title="Bỏ 1 đáp án sai"
            >
              ❌ Bỏ 1 Sai
            </button>
          )}

          {/* 4. Sabotage -10s */}
          {rules.lifelines.reduceOpponentTime && (
            <button
              onClick={useReduceOpponentTime}
              disabled={lifelinesUsed.reduceOpponentTime || phase !== 'question'}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1 ${
                lifelinesUsed.reduceOpponentTime
                  ? 'bg-slate-950/40 text-slate-600 border-slate-850 opacity-40 cursor-not-allowed'
                  : 'bg-slate-900 border-slate-700 text-red-400 hover:border-red-400 hover:scale-105'
              }`}
              title="Trừ 10s đồng hồ đối thủ"
            >
              ⚡ -10s Đối Thủ
            </button>
          )}

          {/* 5. Extra Time +10s */}
          {rules.lifelines.addSelfTime && (
            <button
              onClick={useAddSelfTime}
              disabled={lifelinesUsed.addSelfTime || phase !== 'question'}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1 ${
                lifelinesUsed.addSelfTime
                  ? 'bg-slate-950/40 text-slate-600 border-slate-850 opacity-40 cursor-not-allowed'
                  : 'bg-slate-900 border-slate-700 text-emerald-300 hover:border-emerald-400 hover:scale-105'
              }`}
              title="Cộng thêm 10s thời gian của mình"
            >
              ⏰ +10s Của Mình
            </button>
          )}
        </div>
      </div>

      {/* SMART HINT POPUP MODAL */}
      {showHintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm glass-panel rounded-3xl p-6 border border-amber-400 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-300 flex items-center justify-center mx-auto text-2xl">
              💡
            </div>
            <h4 className="text-lg font-black text-amber-300 uppercase">MANH MỐI GỢI Ý</h4>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed bg-slate-900/90 p-4 rounded-2xl border border-slate-800">
              "{currentQ.hint}"
            </p>
            <button
              onClick={() => setShowHintModal(false)}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors"
            >
              ĐÃ HIỂU, QUAY LẠI CHỌN ĐÁP ÁN
            </button>
          </div>
        </div>
      )}

      {/* POST MATCH RESULT CELEBRATION MODAL */}
      <ResultModal
        isOpen={showResultModal}
        isWin={myScore > opponentScore}
        isDraw={myScore === opponentScore}
        myScore={myScore}
        opponentScore={opponentScore}
        opponentName={opponentProfile.username}
        opponentAvatar={opponentProfile.avatar}
        eloDelta={matchResult?.eloDelta || 0}
        coinReward={matchResult?.coinReward || 0}
        onRematch={() => {
          setShowResultModal(false);
          setCurrentRound(0);
          setMyScore(0);
          setOpponentScore(0);
        }}
        onHome={onExit}
      />
    </div>
  );
};
