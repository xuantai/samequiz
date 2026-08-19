import React, { useState, useEffect } from 'react';
import { Trophy, Users, Clock, Flame, Award, ArrowLeft, Check, Sparkles, AlertCircle, Ticket, Coins } from 'lucide-react';
import { PlayerProfile, Question } from '../types/game';
import { DEFAULT_QUESTIONS } from '../data/defaultQuestions';
import { CATEGORIES } from '../data/categories';
import { soundEngine } from '../services/soundEngine';

interface GrandEventArenaProps {
  profile: PlayerProfile;
  onExit: () => void;
  onUpdateProfile: (updated: PlayerProfile) => void;
}

export const GrandEventArena: React.FC<GrandEventArenaProps> = ({
  profile,
  onExit,
  onUpdateProfile
}) => {
  const [hasTicket, setHasTicket] = useState(false);
  const [inBattle, setInBattle] = useState(false);
  const [currentRound, setCurrentRound] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [myScore, setMyScore] = useState(0);
  const [myRank, setMyRank] = useState(1);
  const [phase, setPhase] = useState<'lobby' | 'question' | 'reveal' | 'finished'>('lobby');

  const [liveLeaderboard] = useState([
    { rank: 1, name: 'Quang Thần Đồng', score: 285, avatar: '🧠' },
    { rank: 2, name: 'Hương Bách Khoa', score: 260, avatar: '🌸' },
    { rank: 3, name: 'Minh Master', score: 245, avatar: '👑' },
    { rank: 4, name: 'Alexander (UK)', score: 230, avatar: '🦁' },
    { rank: 5, name: 'Linh Siêu Tốc', score: 215, avatar: '⚡' },
    { rank: 6, name: 'Bình Chiến Binh', score: 198, avatar: '⚔️' }
  ]);

  const questions = DEFAULT_QUESTIONS.slice(0, 5);
  const currentQ = questions[currentRound] || questions[0];
  const category = CATEGORIES.find(c => currentQ.categoryIds.includes(c.id)) || CATEGORIES[0];

  const handleBuyTicket = () => {
    if (profile.coins < 500) {
      alert('Bạn không đủ Coins để mua vé! (Cần 500 Coins)');
      return;
    }
    const updated = { ...profile, coins: profile.coins - 500 };
    onUpdateProfile(updated);
    setHasTicket(true);
    soundEngine.playLifeline();
  };

  const handleStartBattle = () => {
    setInBattle(true);
    setPhase('question');
    setTimeLeft(30);
    setCurrentRound(0);
    setMyScore(0);
  };

  useEffect(() => {
    if (phase !== 'question') return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          resolveRound(selectedOption);
          return 0;
        }
        if (prev <= 5) soundEngine.playUrgentTick();
        else soundEngine.playTick();
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [phase, currentRound, selectedOption]);

  const handleSelect = (idx: number) => {
    if (confirmed || phase !== 'question') return;
    soundEngine.playSelect();
    setSelectedOption(idx);
  };

  const handleConfirm = () => {
    if (selectedOption === null || confirmed || phase !== 'question') return;
    soundEngine.playConfirm();
    setConfirmed(true);
  };

  const resolveRound = (opt: number | null) => {
    if (phase !== 'question') return;
    setPhase('reveal');

    const isCorrect = opt === currentQ.correctIndex;
    let earned = 0;

    if (isCorrect) {
      soundEngine.playCorrect();
      const simulatedRank = Math.floor(Math.random() * 15) + 1;
      earned = 3 + (100 - simulatedRank);
      setMyScore(prev => prev + earned);
      setMyRank(simulatedRank);
    } else {
      soundEngine.playWrong();
    }

    setTimeout(() => {
      if (currentRound + 1 >= questions.length) {
        setPhase('finished');
      } else {
        setCurrentRound(prev => prev + 1);
        setSelectedOption(null);
        setConfirmed(false);
        setTimeLeft(30);
        setPhase('question');
      }
    }, 4000);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between glass-panel rounded-3xl p-6 border border-amber-500/40">
        <div className="flex items-center gap-4">
          <button
            onClick={onExit}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[11px] font-black uppercase">
                BATTLE ROYALE 100+
              </span>
              <span className="text-xs text-slate-400">Tối Thứ Bảy 20:00 Hàng Tuần</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
              ĐẠI CHIẾN VUA TRI THỨC TOÀN HỆ THỐNG
            </h1>
          </div>
        </div>

        <div className="bg-amber-950/40 border border-amber-500/40 px-4 py-2 rounded-2xl text-right">
          <div className="text-[10px] font-bold text-slate-400 uppercase">Quỹ Thưởng Sự Kiện</div>
          <div className="text-xl font-black text-amber-300 font-mono">50.000 Coins</div>
        </div>
      </div>

      {phase === 'lobby' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 glass-panel rounded-3xl p-8 border border-slate-800 space-y-6">
            <div>
              <h2 className="text-2xl font-black text-white mb-2">Quy Tắc Đấu Trường Battle Royale</h2>
              <div className="space-y-3 text-xs sm:text-sm text-slate-300 bg-slate-900/60 p-5 rounded-2xl border border-slate-800 leading-relaxed">
                <p>🎯 <strong>100+ người cùng thi đấu trên 1 câu hỏi</strong> cùng 1 thời điểm.</p>
                <p>⚡ <strong>Công thức tính điểm:</strong> Trả lời đúng nhận <code className="text-amber-300 font-mono font-bold">3 + (N - Rank)</code> điểm. Người đúng nhanh nhất trong 100 người nhận tới <strong>102 điểm</strong>!</p>
                <p>🏆 <strong>Top 3 chung cuộc</strong> chia nhau quỹ thưởng 50.000 Coin cùng Danh hiệu Phát Sáng độc quyền!</p>
              </div>
            </div>

            <div className="flex items-center gap-4 pt-4 border-t border-slate-800">
              {!hasTicket ? (
                <button
                  onClick={handleBuyTicket}
                  className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/20 flex items-center gap-2 cursor-pointer"
                >
                  <Ticket className="w-5 h-5" /> MUA VÉ THAM GIA (500 COINS)
                </button>
              ) : (
                <button
                  onClick={handleStartBattle}
                  className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/20 flex items-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-5 h-5" /> VÀO PHÒNG ĐẤU NGAY (ĐÃ CÓ VÉ)
                </button>
              )}
            </div>
          </div>

          <div className="glass-panel rounded-3xl p-6 border border-slate-800">
            <h3 className="text-sm font-black text-amber-300 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" /> Bảng Điểm Trực Tiếp Top 6
            </h3>
            <div className="space-y-2.5">
              {liveLeaderboard.map((u) => (
                <div key={u.rank} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80">
                  <div className="flex items-center gap-2.5">
                    <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-mono font-black ${
                      u.rank === 1 ? 'bg-amber-500 text-slate-950' : u.rank === 2 ? 'bg-slate-300 text-slate-950' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {u.rank}
                    </span>
                    <span className="text-lg">{u.avatar}</span>
                    <span className="text-xs font-bold text-slate-200 truncate max-w-[110px]">{u.name}</span>
                  </div>
                  <span className="text-xs font-black font-mono text-cyan-400">{u.score} pts</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {(phase === 'question' || phase === 'reveal') && (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4 items-center glass-panel rounded-2xl p-4 border border-cyan-500/30">
            <div>
              <span className="text-xs font-bold text-slate-400">Câu Hỏi Sự Kiện</span>
              <div className="text-lg font-black text-cyan-400 font-mono">CÂU {currentRound + 1}/{questions.length}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-black text-amber-400 font-mono">{timeLeft}s</div>
              <span className="text-[10px] text-slate-400 uppercase">Thời Gian Còn Lại</span>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-slate-400">Điểm Của Bạn</span>
              <div className="text-lg font-black text-emerald-400 font-mono">{myScore} pts (Hạng #{myRank})</div>
            </div>
          </div>

          <div className="glass-panel rounded-3xl p-8 border border-slate-800 text-center space-y-3">
            <span className={`px-3 py-1 rounded-full bg-gradient-to-r ${category.color} text-white font-black text-xs uppercase`}>
              {category.name}
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white max-w-3xl mx-auto py-2">
              {currentQ.question}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {currentQ.options.map((opt, idx) => {
              const isSelected = selectedOption === idx;
              const isCorrect = idx === currentQ.correctIndex;
              const isReveal = phase === 'reveal';

              let bg = 'bg-slate-900/80 border-slate-800 text-slate-200';
              if (isReveal && isCorrect) bg = 'bg-emerald-500/30 border-emerald-400 text-emerald-300';
              else if (isSelected) bg = confirmed ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200' : 'bg-cyan-950 border-cyan-500';

              return (
                <div
                  key={idx}
                  onClick={() => handleSelect(idx)}
                  className={`p-4 rounded-2xl border-2 cursor-pointer font-bold text-sm sm:text-base flex items-center justify-between transition-all ${bg}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-xs font-mono">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span>{opt}</span>
                  </div>
                  {isSelected && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300">
                      {confirmed ? 'ĐÃ CHỐT' : 'ĐANG CHỌN'}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {phase === 'question' && (
            <div className="text-center">
              <button
                onClick={handleConfirm}
                disabled={selectedOption === null || confirmed}
                className={`px-8 py-3.5 rounded-2xl font-black text-sm transition-all ${
                  selectedOption !== null && !confirmed
                    ? 'bg-gradient-to-r from-cyan-500 to-fuchsia-600 text-slate-950 shadow-xl shadow-cyan-500/30 cursor-pointer'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                {confirmed ? '🔒 ĐÃ CHỐT ĐÁP ÁN (CHỜ TÍNH RANK)' : 'XÁC NHẬN (CHỐT ĐÁP ÁN)'}
              </button>
            </div>
          )}
        </div>
      )}

      {phase === 'finished' && (
        <div className="glass-panel-glow rounded-3xl p-8 border border-amber-500/40 text-center space-y-6 max-w-xl mx-auto">
          <Trophy className="w-16 h-16 text-amber-400 mx-auto animate-bounce" />
          <h2 className="text-3xl font-black text-white uppercase">KẾT THÚC ĐẠI SỰ KIỆN!</h2>
          <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 space-y-2">
            <div className="text-xs text-slate-400 font-bold uppercase">Tổng Điểm Của Bạn</div>
            <div className="text-4xl font-black text-amber-300 font-mono">{myScore} pts</div>
            <div className="text-sm font-bold text-emerald-400">Thứ Hạng Chung Cuộc: #{myRank}/100</div>
          </div>
          <button
            onClick={onExit}
            className="w-full py-3.5 rounded-xl bg-amber-500 text-slate-950 font-black text-sm cursor-pointer"
          >
            VỀ TRANG CHỦ & NHẬN THƯỞNG
          </button>
        </div>
      )}
    </div>
  );
};
