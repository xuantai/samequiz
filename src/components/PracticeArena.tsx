import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, Brain, Sparkles, Trophy, ArrowRight, RotateCcw, 
  Home, Check, X, Flame, Coins, Clock, Lightbulb, HelpCircle, 
  Flag, Award, Target, Filter 
} from 'lucide-react';
import { Question, PlayerProfile, Difficulty } from '../types/game';
import { DEFAULT_QUESTIONS } from '../data/defaultQuestions';
import { CATEGORIES } from '../data/categories';
import { soundEngine } from '../services/soundEngine';
import { recordPracticeResult } from '../services/storageService';

interface PracticeArenaProps {
  profile: PlayerProfile;
  onUpdateProfile: (p: PlayerProfile) => void;
  onExit: () => void;
}

export const PracticeArena: React.FC<PracticeArenaProps> = ({
  profile,
  onUpdateProfile,
  onExit
}) => {
  // Practice Setup State
  const [isConfiguring, setIsConfiguring] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<number | 'all'>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | 'all'>('all');
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [hasTimer, setHasTimer] = useState<boolean>(true);

  // Active Game State
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [timeLeft, setTimeLeft] = useState(20);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [phase, setPhase] = useState<'question' | 'reveal' | 'finished'>('question');

  // Stats in current practice session
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [earnedCoins, setEarnedCoins] = useState(0);
  const [practiceHistory, setPracticeHistory] = useState<{ categoryIds: number[]; isCorrect: boolean }[]>([]);

  // Lifelines
  const [lifelines, setLifelines] = useState({
    fiftyFifty: false,
    hint: false,
    removeOne: false
  });
  const [hiddenOptions, setHiddenOptions] = useState<number[]>([]);
  const [showHint, setShowHint] = useState(false);

  const currentQ = questions[currentRound] || questions[0];
  const category = CATEGORIES.find(c => currentQ?.categoryIds?.includes(c.id)) || CATEGORIES[0];
  const roundStartTimeRef = useRef(Date.now());

  // Start Practice with chosen filters
  const handleStartPractice = () => {
    let pool = [...DEFAULT_QUESTIONS];
    if (selectedCategory !== 'all') {
      pool = pool.filter(q => q.categoryIds.includes(selectedCategory));
    }
    if (selectedDifficulty !== 'all') {
      pool = pool.filter(q => q.difficulty === selectedDifficulty);
    }
    if (pool.length === 0) {
      pool = [...DEFAULT_QUESTIONS];
    }
    pool.sort(() => Math.random() - 0.5);
    const selectedList = pool.slice(0, Math.min(questionCount, pool.length));

    setQuestions(selectedList);
    setCurrentRound(0);
    setScore(0);
    setStreak(0);
    setMaxStreak(0);
    setEarnedCoins(0);
    setPracticeHistory([]);
    setLifelines({ fiftyFifty: false, hint: false, removeOne: false });
    setHiddenOptions([]);
    setIsConfiguring(false);
    setPhase('question');
    setTimeLeft(20);
    roundStartTimeRef.current = Date.now();
  };

  // Reset each question round
  useEffect(() => {
    if (isConfiguring || questions.length === 0) return;

    if (currentRound >= questions.length) {
      finishPractice();
      return;
    }

    setTimeLeft(20);
    setSelectedOption(null);
    setConfirmed(false);
    setHiddenOptions([]);
    setShowHint(false);
    setPhase('question');
    roundStartTimeRef.current = Date.now();
  }, [currentRound, isConfiguring]);

  // Timer Countdown (if enabled)
  useEffect(() => {
    if (isConfiguring || phase !== 'question' || !hasTimer) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleConfirm(selectedOption, true);
          return 0;
        }
        if (prev <= 5) soundEngine.playUrgentTick();
        else soundEngine.playTick();
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase, currentRound, hasTimer, isConfiguring, selectedOption]);

  // Handle Option Click
  const handleSelect = (idx: number) => {
    if (confirmed || phase !== 'question' || hiddenOptions.includes(idx)) return;
    soundEngine.playSelect();
    setSelectedOption(idx);
  };

  // Confirm Answer
  const handleConfirm = (optIndex: number | null = selectedOption, isTimeOut: boolean = false) => {
    if (phase !== 'question') return;
    setConfirmed(true);
    setPhase('reveal');

    const isCorrect = optIndex === currentQ?.correctIndex;
    let newStreak = streak;

    if (isCorrect) {
      soundEngine.playCorrect();
      newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > maxStreak) setMaxStreak(newStreak);
      setScore(prev => prev + 3);
      setEarnedCoins(prev => prev + 10);
    } else {
      soundEngine.playWrong();
      setStreak(0);
    }

    setPracticeHistory(prev => [...prev, { categoryIds: currentQ?.categoryIds || [], isCorrect }]);
  };

  // Finish Practice and Award Coins
  const finishPractice = () => {
    setPhase('finished');
    const result = recordPracticeResult(practiceHistory, maxStreak);
    setEarnedCoins(result.coinReward);
    // Refresh user profile in app
    onUpdateProfile({ ...profile, coins: profile.coins + result.coinReward });
    soundEngine.playVictory();
  };

  // Lifelines
  const useFiftyFifty = () => {
    if (lifelines.fiftyFifty || phase !== 'question') return;
    soundEngine.playLifeline();
    setLifelines({ ...lifelines, fiftyFifty: true });
    const wrongs = [0, 1, 2, 3].filter(i => i !== currentQ.correctIndex).sort(() => Math.random() - 0.5);
    setHiddenOptions([wrongs[0], wrongs[1]]);
  };

  const useHint = () => {
    if (lifelines.hint || phase !== 'question') return;
    soundEngine.playLifeline();
    setLifelines({ ...lifelines, hint: true });
    setShowHint(true);
  };

  const useRemoveOne = () => {
    if (lifelines.removeOne || phase !== 'question') return;
    soundEngine.playLifeline();
    setLifelines({ ...lifelines, removeOne: true });
    const wrongs = [0, 1, 2, 3].filter(i => i !== currentQ.correctIndex && !hiddenOptions.includes(i));
    if (wrongs.length > 0) setHiddenOptions(prev => [...prev, wrongs[0]]);
  };

  // --- VIEW 1: CONFIGURATION SCREEN ---
  if (isConfiguring) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 animate-fade-in">
        <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-cyan-500/30 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 flex items-center justify-center">
                <Brain className="w-6 h-6" />
              </div>
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-black uppercase">
                  SOLO PRACTICE MODE
                </span>
                <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
                  PH�NG LUY?N T?P TRI TH?C
                </h1>
              </div>
            </div>

            <button
              onClick={onExit}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <Home className="w-5 h-5" />
            </button>
          </div>

          <p className="text-slate-300 text-sm leading-relaxed mb-6">
            T? do r�n luy?n tr� nh? v� ph?n x? v?i 15 chuy�n m?c tri th?c. Sau m?i c�u h?i s? c� <strong>gi?i th�ch chi ti?t</strong>. M?i c�u d�ng nh?n thu?ng <strong>+10 Coins</strong> d? t�ch luy mua s?m v?t ph?m!
          </p>

          {/* 1. Category Selection */}
          <div className="space-y-3 mb-6">
            <label className="text-xs font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-cyan-400" /> Ch?n Chuy�n M?c R�n Luy?n:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`p-3 rounded-2xl text-xs font-bold transition-all text-left border cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-black shadow-lg shadow-cyan-500/20'
                    : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:border-cyan-500/40'
                }`}
              >
                ?? T?t C? (Ng?u Nhi�n)
              </button>
              {CATEGORIES.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.id)}
                  className={`p-3 rounded-2xl text-xs font-bold transition-all text-left border truncate cursor-pointer ${
                    selectedCategory === c.id
                      ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-black shadow-lg shadow-cyan-500/20'
                      : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:border-cyan-500/40'
                  }`}
                >
                  #{c.id} {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Difficulty & Question Count */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {/* Difficulty */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase">�? Kh�:</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'all', label: 'Ng?u nhi�n' },
                  { id: 'easy', label: 'D?' },
                  { id: 'medium', label: 'V?a' },
                  { id: 'hard', label: 'Kh�' }
                ].map(d => (
                  <button
                    key={d.id}
                    onClick={() => setSelectedDifficulty(d.id as any)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      selectedDifficulty === d.id
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-black'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-emerald-500/50'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Question Count */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase">S? Lu?ng C�u:</label>
              <div className="grid grid-cols-4 gap-1.5">
                {[5, 10, 15, 20].map(cnt => (
                  <button
                    key={cnt}
                    onClick={() => setQuestionCount(cnt)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      questionCount === cnt
                        ? 'bg-amber-500 text-slate-950 border-amber-400 font-black'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-amber-500/50'
                    }`}
                  >
                    {cnt} c�u
                  </button>
                ))}
              </div>
            </div>

            {/* Timer Toggle */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase">Ch? �? Gi?:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setHasTimer(true)}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    hasTimer
                      ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-black'
                      : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                >
                  ?? 20 Gi�y
                </button>
                <button
                  onClick={() => setHasTimer(false)}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    !hasTimer
                      ? 'bg-purple-500 text-slate-950 border-purple-400 font-black'
                      : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                >
                  ?? Kh�ng Gi?i H?n
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={handleStartPractice}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-sky-400 to-fuchsia-500 hover:from-cyan-400 hover:to-fuchsia-400 text-slate-950 font-black text-base shadow-xl shadow-cyan-500/30 hover:scale-[1.01] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-5 h-5" /> B?T �?U LUY?N T?P NGAY
          </button>
        </div>
      </div>
    );
  }

  // --- VIEW 2: FINISHED PRACTICE SUMMARY ---
  if (phase === 'finished') {
    const correctCount = practiceHistory.filter(h => h.isCorrect).length;
    const accuracy = Math.round((correctCount / (practiceHistory.length || 1)) * 100);

    return (
      <div className="max-w-2xl mx-auto px-4 py-8 animate-fade-in">
        <div className="glass-panel rounded-3xl p-8 border border-emerald-500/40 text-center space-y-6 shadow-2xl">
          <div className="w-20 h-20 rounded-3xl bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500/40 flex items-center justify-center mx-auto text-4xl shadow-lg shadow-emerald-500/20">
            ??
          </div>

          <div>
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-black uppercase">
              HO�N TH�NH LUY?N T?P
            </span>
            <h2 className="text-3xl font-black text-white mt-2">
              K?T QU? R�N LUY?N
            </h2>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-900/80 rounded-2xl p-4 border border-slate-800">
              <div className="text-xs text-slate-400 font-bold uppercase">��ng / T?ng</div>
              <div className="text-2xl font-black text-emerald-400 mt-1 font-mono">
                {correctCount}/{practiceHistory.length}
              </div>
              <div className="text-[10px] text-slate-400">({accuracy}%)</div>
            </div>

            <div className="bg-slate-900/80 rounded-2xl p-4 border border-slate-800">
              <div className="text-xs text-slate-400 font-bold uppercase">Chu?i D�i Nh?t</div>
              <div className="text-2xl font-black text-orange-400 mt-1 font-mono flex items-center justify-center gap-1">
                <Flame className="w-5 h-5 fill-current" /> {maxStreak}x
              </div>
              <div className="text-[10px] text-slate-400">Combo d�ng</div>
            </div>

            <div className="bg-slate-900/80 rounded-2xl p-4 border border-amber-500/30 bg-amber-950/20">
              <div className="text-xs text-amber-400 font-bold uppercase">Thu?ng Coins</div>
              <div className="text-2xl font-black text-amber-300 mt-1 font-mono flex items-center justify-center gap-1">
                <Coins className="w-5 h-5 text-amber-400" /> +{earnedCoins}
              </div>
              <div className="text-[10px] text-slate-400">�� c?ng v�o v�</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={() => setIsConfiguring(true)}
              className="flex-1 py-3.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-sm transition-transform hover:scale-[1.02] flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" /> LUY?N T?P TI?P
            </button>
            <button
              onClick={onExit}
              className="flex-1 py-3.5 rounded-2xl bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-200 font-bold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Home className="w-4 h-4" /> V? TRANG CH?
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- VIEW 3: IN-GAME PRACTICE ARENA ---
  return (
    <div className="max-w-4xl mx-auto px-4 py-4 min-h-[85vh] flex flex-col justify-between animate-fade-in space-y-4">
      {/* Top Header HUD */}
      <div className="glass-panel rounded-3xl p-4 border border-cyan-500/30 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-2xl border-2 ${profile.avatarFrame || 'border-cyan-500'}`}>
            {profile.avatar}
          </div>
          <div>
            <div className="text-sm font-black text-white">{profile.username}</div>
            <div className="flex items-center gap-3 text-xs font-bold">
              <span className="text-cyan-400 font-mono">{score} pts</span>
              {streak >= 2 && (
                <span className="text-orange-400 flex items-center gap-0.5">
                  <Flame className="w-3.5 h-3.5 fill-current" /> {streak}x
                </span>
              )}
              <span className="text-amber-300 flex items-center gap-1 font-mono">
                <Coins className="w-3.5 h-3.5 text-amber-400" /> +{earnedCoins}
              </span>
            </div>
          </div>
        </div>

        {/* Center: Timer & Progress */}
        <div className="flex items-center gap-4">
          {hasTimer ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-900 border border-cyan-500/30">
              <Clock className="w-4 h-4 text-cyan-400 animate-spin" />
              <span className={`text-lg font-black font-mono ${timeLeft <= 5 ? 'text-rose-400 animate-pulse' : 'text-cyan-300'}`}>
                {timeLeft}s
              </span>
            </div>
          ) : (
            <span className="text-xs px-3 py-1.5 rounded-full bg-purple-500/20 text-purple-300 font-bold">
              ?? Kh�ng Gi?i H?n Gi?
            </span>
          )}

          <div className="text-right">
            <span className="text-xs font-black text-slate-400 uppercase">
              C�u {currentRound + 1}/{questions.length}
            </span>
          </div>
        </div>

        <button
          onClick={onExit}
          className="p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
          title="Tho�t ph�ng luy?n t?p"
        >
          <Home className="w-5 h-5" />
        </button>
      </div>

      {/* Question Card */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl relative">
        <div className="flex items-center justify-between mb-3">
          <span className={`px-3 py-1 rounded-full bg-gradient-to-r ${category.color} text-white font-black text-xs uppercase tracking-wider`}>
            {category.name}
          </span>
          <span className="text-xs text-slate-400 font-bold uppercase">
            �? kh�: <strong className="text-cyan-400">{currentQ?.difficulty}</strong>
          </span>
        </div>

        <h2 className="text-xl sm:text-2xl font-black text-white text-center leading-snug py-4">
          {currentQ?.question}
        </h2>
      </div>

      {/* 4 Choices */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {currentQ?.options.map((optText, idx) => {
          const isSelected = selectedOption === idx;
          const isHidden = hiddenOptions.includes(idx);
          const isCorrect = idx === currentQ.correctIndex;
          const isReveal = phase === 'reveal';

          let style = 'bg-slate-900/80 border-slate-800 text-slate-200 hover:border-cyan-500/50';
          let badge = 'bg-slate-800 text-slate-300';

          if (isHidden) {
            return (
              <div key={idx} className="p-4 rounded-2xl border border-slate-900 bg-slate-950/40 opacity-20 pointer-events-none">
                <span className="line-through text-sm">--- �� B? ---</span>
              </div>
            );
          }

          if (isReveal) {
            if (isCorrect) {
              style = 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.3)]';
              badge = 'bg-emerald-500 text-slate-950 font-black';
            } else if (isSelected && !isCorrect) {
              style = 'bg-rose-500/20 border-rose-500 text-rose-300';
              badge = 'bg-rose-500 text-white font-black';
            }
          } else if (isSelected) {
            style = 'bg-cyan-500/20 border-cyan-400 text-cyan-200 neon-glow-cyan';
            badge = 'bg-cyan-500 text-slate-950 font-black';
          }

          return (
            <div
              key={idx}
              onClick={() => handleSelect(idx)}
              className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${style}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm ${badge}`}>
                  {String.fromCharCode(65 + idx)}
                </div>
                <span className="text-sm sm:text-base font-bold leading-relaxed">{optText}</span>
              </div>

              {isReveal && isCorrect && <Check className="w-5 h-5 text-emerald-400" />}
              {isReveal && isSelected && !isCorrect && <X className="w-5 h-5 text-rose-400" />}
            </div>
          );
        })}
      </div>

      {/* Action / Explanation Box */}
      {phase === 'question' ? (
        <div className="flex justify-center gap-4">
          <button
            onClick={() => handleConfirm()}
            disabled={selectedOption === null}
            className={`px-8 py-3.5 rounded-2xl font-black text-sm shadow-xl flex items-center gap-2 transition-all ${
              selectedOption !== null
                ? 'bg-gradient-to-r from-cyan-500 to-fuchsia-600 hover:from-cyan-400 text-slate-950 shadow-cyan-500/30 scale-105 cursor-pointer'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'
            }`}
          >
            <Check className="w-5 h-5" /> CH?T ��P �N
          </button>
        </div>
      ) : (
        <div className="glass-panel rounded-3xl p-5 border border-slate-700 space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-black text-sm">
              {selectedOption === currentQ.correctIndex ? (
                <span className="text-emerald-400 flex items-center gap-1.5">
                  <Check className="w-5 h-5" /> Ch�nh x�c! (+3 di?m, +10 Coins)
                </span>
              ) : (
                <span className="text-rose-400 flex items-center gap-1.5">
                  <X className="w-5 h-5" /> Chua ch�nh x�c!
                </span>
              )}
            </div>

            <button
              onClick={() => setCurrentRound(prev => prev + 1)}
              className="px-6 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-lg transition-transform hover:scale-105 cursor-pointer"
            >
              C�U TI?P THEO <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {currentQ.explanation && (
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800">
              ?? <strong>Ki?n th?c ghi nh?:</strong> {currentQ.explanation}
            </p>
          )}
        </div>
      )}

      {/* Lifelines */}
      <div className="glass-panel rounded-2xl p-2.5 border border-slate-800 flex items-center justify-center gap-3">
        <span className="text-xs font-bold text-slate-400 uppercase hidden sm:inline">Tr? gi�p:</span>
        <button
          onClick={useFiftyFifty}
          disabled={lifelines.fiftyFifty || phase !== 'question'}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
            lifelines.fiftyFifty ? 'opacity-30 bg-slate-900 border-slate-800 cursor-not-allowed' : 'bg-slate-900 border-slate-700 text-cyan-300 hover:border-cyan-400'
          }`}
        >
          ?? 50:50
        </button>
        <button
          onClick={useHint}
          disabled={lifelines.hint || phase !== 'question'}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
            lifelines.hint ? 'opacity-30 bg-slate-900 border-slate-800 cursor-not-allowed' : 'bg-slate-900 border-slate-700 text-amber-300 hover:border-amber-400'
          }`}
        >
          ?? G?i �
        </button>
        <button
          onClick={useRemoveOne}
          disabled={lifelines.removeOne || phase !== 'question'}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
            lifelines.removeOne ? 'opacity-30 bg-slate-900 border-slate-800 cursor-not-allowed' : 'bg-slate-900 border-slate-700 text-rose-300 hover:border-rose-400'
          }`}
        >
          ? B? 1 Sai
        </button>
      </div>

      {/* Hint Modal */}
      {showHint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm glass-panel rounded-3xl p-6 border border-amber-400 shadow-2xl text-center space-y-3">
            <div className="text-3xl">??</div>
            <h4 className="text-base font-black text-amber-300 uppercase">G?I � C?A C�U H?I</h4>
            <p className="text-xs text-slate-200 bg-slate-900/90 p-4 rounded-2xl border border-slate-800">
              "{currentQ.hint}"
            </p>
            <button
              onClick={() => setShowHint(false)}
              className="w-full py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs cursor-pointer"
            >
              �� HI?U
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
