import React, { useEffect, useState } from 'react';
import { Trophy, Award, Coins, RefreshCw, Flag, CheckCircle, Home, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { PlayerProfile } from '../types/game';
import { soundEngine } from '../services/soundEngine';
import { submitQuestionReport } from '../services/storageService';

interface ResultModalProps {
  isOpen: boolean;
  isWin: boolean;
  isDraw?: boolean;
  myScore: number;
  opponentScore: number;
  opponentName: string;
  opponentAvatar: string;
  eloDelta: number;
  coinReward: number;
  onRematch: () => void;
  onHome: () => void;
}

export const ResultModal: React.FC<ResultModalProps> = ({
  isOpen,
  isWin,
  isDraw,
  myScore,
  opponentScore,
  opponentName,
  opponentAvatar,
  eloDelta,
  coinReward,
  onRematch,
  onHome
}) => {
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportSuccess, setReportSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (isWin) {
        soundEngine.playVictory();
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    }
  }, [isOpen, isWin]);

  if (!isOpen) return null;

  const handleSendReport = () => {
    if (!reportReason.trim()) return;
    submitQuestionReport('match_last_q', 'Báo cáo câu hỏi trong ván đấu vừa qua', reportReason);
    setReportSuccess(true);
    setTimeout(() => {
      setReportSuccess(false);
      setReportModalOpen(false);
      setReportReason('');
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md glass-panel-glow rounded-3xl border border-cyan-500/40 p-8 shadow-2xl text-center relative overflow-hidden">
        {/* Header Glow */}
        <div className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${
          isWin ? 'from-amber-400 via-yellow-300 to-amber-500' : isDraw ? 'from-cyan-400 to-blue-500' : 'from-rose-500 to-red-600'
        }`} />

        {/* Big Trophy/Badge Icon */}
        <div className="relative inline-block mb-4">
          <div className={`w-24 h-24 mx-auto rounded-3xl flex items-center justify-center shadow-2xl border-2 ${
            isWin ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-amber-500/40' : isDraw ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-cyan-500/40' : 'bg-rose-500/20 border-rose-400 text-rose-300'
          }`}>
            {isWin ? <Trophy className="w-12 h-12 animate-bounce" /> : isDraw ? <Award className="w-12 h-12" /> : <span className="text-4xl">⚔️</span>}
          </div>
        </div>

        <h2 className="text-3xl font-black text-white tracking-tight uppercase mb-1">
          {isWin ? 'CHIẾN THẮNG VANG DỘI!' : isDraw ? 'TRẬN ĐẤU HÒA ĐIỂM!' : 'THẤT BẠI ĐÁNG TIẾC'}
        </h2>
        <p className="text-xs text-slate-400 mb-6">
          {isWin ? 'Bạn đã thể hiện tốc độ phản xạ và kiến thức xuất sắc!' : isDraw ? 'Hai kỳ phùng địch thủ cân tài cân sức!' : 'Hãy luyện tập thêm để phục thù ở trận tái đấu nhé!'}
        </p>

        {/* Scoreboard Comparison */}
        <div className="grid grid-cols-2 gap-4 bg-slate-900/80 rounded-2xl p-4 border border-slate-800 mb-6">
          <div className="text-center border-r border-slate-800 pr-2">
            <div className="text-xs font-bold text-cyan-400 uppercase">Bạn</div>
            <div className="text-3xl font-black text-white font-mono mt-1">{myScore}</div>
            <div className="text-[11px] text-slate-400">điểm</div>
          </div>
          <div className="text-center pl-2">
            <div className="text-xs font-bold text-fuchsia-400 uppercase flex items-center justify-center gap-1">
              <span>{opponentAvatar}</span> {opponentName}
            </div>
            <div className="text-3xl font-black text-white font-mono mt-1">{opponentScore}</div>
            <div className="text-[11px] text-slate-400">điểm</div>
          </div>
        </div>

        {/* Rewards Section */}
        <div className="flex items-center justify-center gap-6 bg-slate-900/50 rounded-xl p-3 border border-slate-800/80 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-bold">ELO:</span>
            <span className={`text-sm font-black font-mono ${eloDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {eloDelta >= 0 ? `+${eloDelta}` : eloDelta}
            </span>
          </div>
          <div className="w-px h-5 bg-slate-800" />
          <div className="flex items-center gap-1.5">
            <Coins className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-black text-amber-300 font-mono">+{coinReward}</span>
            <span className="text-[10px] text-slate-400">Coins</span>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={onRematch}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-fuchsia-600 hover:from-cyan-400 hover:to-fuchsia-500 text-slate-950 font-black text-sm shadow-xl shadow-cyan-500/20 hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> TÁI ĐẤU NGAY
          </button>
          
          <div className="flex gap-2">
            <button
              onClick={onHome}
              className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <Home className="w-4 h-4" /> Về Trang Chủ
            </button>
            <button
              onClick={() => setReportModalOpen(true)}
              className="px-3 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-bold text-xs flex items-center gap-1 transition-colors"
              title="Báo lỗi câu hỏi nhận 500 Coin"
            >
              <Flag className="w-3.5 h-3.5" /> Báo Lỗi (+500🪙)
            </button>
          </div>
        </div>

        {/* Fact Hunter Report Sub-Modal */}
        {reportModalOpen && (
          <div className="absolute inset-0 bg-slate-950/95 p-6 flex flex-col justify-between animate-fade-in z-20">
            <div>
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-sm font-extrabold text-amber-400 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" /> THỢ SĂN LỖI TRI THỨC
                </h4>
                <button
                  onClick={() => setReportModalOpen(false)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Đóng
                </button>
              </div>
              <p className="text-xs text-slate-300 text-left mb-3">
                Nếu bạn phát hiện câu hỏi trong ván vừa rồi bị sai đáp án hoặc nguồn không chuẩn, hãy mô tả chi tiết. Admin duyệt đúng bạn sẽ nhận ngay <strong>500 Coin</strong>!
              </p>
              <textarea
                value={reportReason}
                onChange={e => setReportReason(e.target.value)}
                placeholder="Mô tả lý do sai hoặc đáp án chính xác..."
                className="w-full h-24 bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-amber-400 resize-none"
              />
            </div>

            {reportSuccess ? (
              <div className="py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500 text-emerald-300 text-xs font-bold flex items-center justify-center gap-1.5">
                <CheckCircle className="w-4 h-4" /> Đã gửi báo cáo! Chúc bạn nhận thưởng!
              </div>
            ) : (
              <button
                onClick={handleSendReport}
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors"
              >
                GỬI BÁO CÁO THẨM ĐỊNH
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
