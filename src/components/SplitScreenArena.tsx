import React, { useState, useEffect, useRef } from 'react';
import { RotateCcw, ArrowLeft } from 'lucide-react';
import { Question } from '../types/game';
import { DEFAULT_QUESTIONS } from '../data/defaultQuestions';
import { CATEGORIES } from '../data/categories';
import { soundEngine } from '../services/soundEngine';

interface SplitScreenArenaProps {
  onExit: () => void;
}

export const SplitScreenArena: React.FC<SplitScreenArenaProps> = ({ onExit }) => {
  const [questions] = useState<Question[]>(() => [...DEFAULT_QUESTIONS].sort(() => Math.random() - 0.5).slice(0, 10));
  const [currentRound, setCurrentRound] = useState(0);
  const [timeLeft, setTimeLeft] = useState(20);

  // Player 1 (Bottom)
  const [p1Selection, setP1Selection] = useState<number | null>(null);
  const [p1Confirmed, setP1Confirmed] = useState(false);
  const [p1Time, setP1Time] = useState<number | null>(null);
  const [p1Score, setP1Score] = useState(0);

  // Player 2 (Top - Rotated 180 deg)
  const [p2Selection, setP2Selection] = useState<number | null>(null);
  const [p2Confirmed, setP2Confirmed] = useState(false);
  const [p2Time, setP2Time] = useState<number | null>(null);
  const [p2Score, setP2Score] = useState(0);

  const [phase, setPhase] = useState<'question' | 'reveal' | 'finished'>('question');
  const [roundPoints, setRoundPoints] = useState({ p1: 0, p2: 0 });

  const roundStartTime = useRef(Date.now());
  const currentQ = questions[currentRound] || questions[0];
  const category = CATEGORIES.find(c => currentQ.categoryIds.includes(c.id)) || CATEGORIES[0];

  useEffect(() => {
    if (currentRound >= questions.length) {
      setPhase('finished');
      return;
    }

    setTimeLeft(20);
    setP1Selection(null);
    setP1Confirmed(false);
    setP1Time(null);
    setP2Selection(null);
    setP2Confirmed(false);
    setP2Time(null);
    setPhase('question');
    roundStartTime.current = Date.now();
  }, [currentRound]);

  // Timer
  useEffect(() => {
    if (phase !== 'question') return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          resolveRound(p1Selection, p1Time || 20000, p2Selection, p2Time || 20000);
          return 0;
        }
        if (prev <= 5) soundEngine.playUrgentTick();
        else soundEngine.playTick();
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [phase, currentRound, p1Selection, p2Selection, p1Time, p2Time]);

  const handleP1Select = (idx: number) => {
    if (p1Confirmed || phase !== 'question') return;
    soundEngine.playSelect();
    setP1Selection(idx);
  };

  const handleP1Confirm = () => {
    if (p1Selection === null || p1Confirmed || phase !== 'question') return;
    soundEngine.playConfirm();
    setP1Confirmed(true);
    const t = Date.now() - roundStartTime.current;
    setP1Time(t);
    if (p2Confirmed) {
      setTimeout(() => resolveRound(p1Selection, t, p2Selection, p2Time || 15000), 400);
    }
  };

  const handleP2Select = (idx: number) => {
    if (p2Confirmed || phase !== 'question') return;
    soundEngine.playSelect();
    setP2Selection(idx);
  };

  const handleP2Confirm = () => {
    if (p2Selection === null || p2Confirmed || phase !== 'question') return;
    soundEngine.playConfirm();
    setP2Confirmed(true);
    const t = Date.now() - roundStartTime.current;
    setP2Time(t);
    if (p1Confirmed) {
      setTimeout(() => resolveRound(p1Selection, p1Time || 15000, p2Selection, t), 400);
    }
  };

  const resolveRound = (p1Opt: number | null, t1: number, p2Opt: number | null, t2: number) => {
    if (phase !== 'question') return;
    setPhase('reveal');

    const p1Correct = p1Opt === currentQ.correctIndex;
    const p2Correct = p2Opt === currentQ.correctIndex;

    let pts1 = 0;
    let pts2 = 0;

    // RULE 3-1-0
    if (p1Correct && p2Correct) {
      if (t1 <= t2) {
        pts1 = 3;
        pts2 = 1;
      } else {
        pts1 = 1;
        pts2 = 3;
      }
    } else if (p1Correct && !p2Correct) {
      pts1 = 3;
      pts2 = 0;
    } else if (!p1Correct && p2Correct) {
      pts1 = 0;
      pts2 = 3;
    }

    if (p1Correct || p2Correct) soundEngine.playCorrect();
    else soundEngine.playWrong();

    setP1Score(prev => prev + pts1);
    setP2Score(prev => prev + pts2);
    setRoundPoints({ p1: pts1, p2: pts2 });

    setTimeout(() => {
      setCurrentRound(prev => prev + 1);
    }, 4000);
  };

  return (
    <div className="max-w-4xl mx-auto h-[95vh] flex flex-col justify-between p-3 animate-fade-in relative select-none">
      {/* Back button */}
      <button
        onClick={onExit}
        className="absolute top-2 left-2 z-50 p-2 rounded-xl bg-slate-900/80 border border-slate-700 text-slate-300 hover:text-white cursor-pointer"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      {/* TOP HALF: PLAYER 2 */}
      <div className="flex-1 rounded-3xl p-4 bg-fuchsia-950/20 border border-fuchsia-500/30 flex flex-col justify-between rotate-180 transition-all">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🦁</span>
            <div>
              <span className="text-xs font-black text-fuchsia-300 uppercase">NGƯỜI CHƠI 2 (TOP)</span>
              <div className="text-xl font-black text-fuchsia-400 font-mono">{p2Score} pts</div>
            </div>
          </div>
          <div className="text-xs font-bold">
            {p2Confirmed ? (
              <span className="text-emerald-400">🔒 Đã chốt</span>
            ) : p2Selection !== null ? (
              <span className="text-amber-400">⏳ Đang tick</span>
            ) : (
              <span className="text-slate-400">🤔 Chưa chọn</span>
            )}
          </div>
        </div>

        {/* 4 Choices P2 */}
        <div className="grid grid-cols-2 gap-2 my-2">
          {currentQ.options.map((opt, idx) => {
            const isSelected = p2Selection === idx;
            const isCorrect = idx === currentQ.correctIndex;
            const isReveal = phase === 'reveal';

            let bg = 'bg-slate-900/80 border-slate-800 text-slate-200';
            if (isReveal && isCorrect) bg = 'bg-emerald-500/30 border-emerald-400 text-emerald-300';
            else if (isSelected) bg = p2Confirmed ? 'bg-fuchsia-500/30 border-fuchsia-400 text-fuchsia-200' : 'bg-fuchsia-950 border-fuchsia-500';

            return (
              <button
                key={idx}
                onClick={() => handleP2Select(idx)}
                className={`p-3 rounded-xl border font-bold text-xs flex items-center gap-2 transition-all ${bg}`}
              >
                <span className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center text-xs">
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className="truncate">{opt}</span>
              </button>
            );
          })}
        </div>

        {/* Confirm Button P2 */}
        <button
          onClick={handleP2Confirm}
          disabled={p2Selection === null || p2Confirmed || phase !== 'question'}
          className={`w-full py-2.5 rounded-xl font-black text-xs transition-all ${
            p2Selection !== null && !p2Confirmed
              ? 'bg-fuchsia-500 text-slate-950 shadow-lg shadow-fuchsia-500/30 cursor-pointer'
              : 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed'
          }`}
        >
          {p2Confirmed ? '🔒 ĐÃ CHỐT ĐÁP ÁN' : 'XÁC NHẬN (CHỐT ĐÁP ÁN)'}
        </button>
      </div>

      {/* CENTER DIVIDER: QUESTION & 30S TIMER */}
      <div className="my-2 py-3 px-4 rounded-2xl glass-panel border border-cyan-500/40 text-center relative shadow-xl">
        <div className="flex items-center justify-between text-xs font-bold mb-1">
          <span className="text-cyan-400 font-mono">CÂU {currentRound + 1}/10</span>
          <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px]">
            {category.name}
          </span>
          <span className="text-amber-400 font-mono font-black text-sm">{timeLeft}s</span>
        </div>
        <h3 className="text-sm sm:text-base font-black text-white py-1">
          {currentQ.question}
        </h3>
        {phase === 'reveal' && (
          <div className="text-xs font-mono font-bold text-emerald-400 mt-1">
            P1: +{roundPoints.p1} pts | P2: +{roundPoints.p2} pts
          </div>
        )}
      </div>

      {/* BOTTOM HALF: PLAYER 1 */}
      <div className="flex-1 rounded-3xl p-4 bg-cyan-950/20 border border-cyan-500/30 flex flex-col justify-between transition-all">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚡</span>
            <div>
              <span className="text-xs font-black text-cyan-300 uppercase">NGƯỜI CHƠI 1 (BOTTOM)</span>
              <div className="text-xl font-black text-cyan-400 font-mono">{p1Score} pts</div>
            </div>
          </div>
          <div className="text-xs font-bold">
            {p1Confirmed ? (
              <span className="text-emerald-400">🔒 Đã chốt</span>
            ) : p1Selection !== null ? (
              <span className="text-amber-400">⏳ Đang tick</span>
            ) : (
              <span className="text-slate-400">🤔 Chưa chọn</span>
            )}
          </div>
        </div>

        {/* 4 Choices P1 */}
        <div className="grid grid-cols-2 gap-2 my-2">
          {currentQ.options.map((opt, idx) => {
            const isSelected = p1Selection === idx;
            const isCorrect = idx === currentQ.correctIndex;
            const isReveal = phase === 'reveal';

            let bg = 'bg-slate-900/80 border-slate-800 text-slate-200';
            if (isReveal && isCorrect) bg = 'bg-emerald-500/30 border-emerald-400 text-emerald-300';
            else if (isSelected) bg = p1Confirmed ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200' : 'bg-cyan-950 border-cyan-500';

            return (
              <button
                key={idx}
                onClick={() => handleP1Select(idx)}
                className={`p-3 rounded-xl border font-bold text-xs flex items-center gap-2 transition-all ${bg}`}
              >
                <span className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center text-xs">
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className="truncate">{opt}</span>
              </button>
            );
          })}
        </div>

        {/* Confirm Button P1 */}
        <button
          onClick={handleP1Confirm}
          disabled={p1Selection === null || p1Confirmed || phase !== 'question'}
          className={`w-full py-2.5 rounded-xl font-black text-xs transition-all ${
            p1Selection !== null && !p1Confirmed
              ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/30 cursor-pointer'
              : 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed'
          }`}
        >
          {p1Confirmed ? '🔒 ĐÃ CHỐT ĐÁP ÁN' : 'XÁC NHẬN (CHỐT ĐÁP ÁN)'}
        </button>
      </div>

      {/* FINISHED MODAL */}
      {phase === 'finished' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm glass-panel rounded-3xl p-6 border border-cyan-500/40 text-center space-y-4 shadow-2xl">
            <h3 className="text-2xl font-black text-white uppercase">KẾT THÚC VÁN ĐẤU!</h3>
            <div className="grid grid-cols-2 gap-4 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
              <div>
                <div className="text-xs font-bold text-cyan-400">P1 (Bottom)</div>
                <div className="text-3xl font-black text-white font-mono">{p1Score}</div>
              </div>
              <div>
                <div className="text-xs font-bold text-fuchsia-400">P2 (Top)</div>
                <div className="text-3xl font-black text-white font-mono">{p2Score}</div>
              </div>
            </div>
            <p className="text-sm font-bold text-amber-300">
              {p1Score > p2Score ? '🎉 Người chơi 1 Chiến Thắng!' : p2Score > p1Score ? '🎉 Người chơi 2 Chiến Thắng!' : '🤝 Hai người chơi Hòa nhau!'}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setCurrentRound(0);
                  setP1Score(0);
                  setP2Score(0);
                }}
                className="flex-1 py-3 rounded-xl bg-cyan-500 text-slate-950 font-black text-xs flex items-center justify-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" /> Đấu Lại
              </button>
              <button
                onClick={onExit}
                className="flex-1 py-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 font-bold text-xs cursor-pointer"
              >
                Trang Chủ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
