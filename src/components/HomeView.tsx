import React, { useState } from 'react';
import { Swords, Users, Trophy, Crown, Sparkles, Flame, Shield, ArrowRight, Zap, Target, Award, Play } from 'lucide-react';
import { PlayerProfile, UserStats, MatchRules } from '../types/game';
import { getCategoryProficiencies } from '../services/storageService';
import { MatchmakingModal } from './MatchmakingModal';

interface HomeViewProps {
  profile: PlayerProfile;
  onOpenMatchmaking: (mode: 'random' | 'friend') => void;
  onOpenPractice: () => void;
  onOpenSplitScreen: () => void;
  onOpenTournament: () => void;
  onOpenGrandEvent: () => void;
  onOpenShop?: () => void;
  onOpenLeaderboard?: () => void;
  onOpenProfile: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  profile,
  onOpenMatchmaking,
  onOpenPractice,
  onOpenSplitScreen,
  onOpenTournament,
  onOpenGrandEvent,
  onOpenShop,
  onOpenLeaderboard,
  onOpenProfile
}) => {
  const proficiencies = getCategoryProficiencies(profile.statsOnline);
  // Sort to find Top 3 Strengths and Top 3 Weaknesses
  const sorted = [...proficiencies].sort((a, b) => b.winRate - a.winRate);
  const strengths = sorted.slice(0, 3);
  const weaknesses = sorted.slice(-3).reverse();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
      {/* Hero Banner with Futuristic Cyber Esports Theme */}
      <div className="relative rounded-3xl overflow-hidden glass-panel-glow border border-cyan-500/30 p-8 sm:p-10">
        <div className="absolute -right-10 -bottom-10 w-96 h-96 bg-gradient-to-br from-cyan-500/20 via-fuchsia-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 right-0 p-8 hidden lg:block opacity-20 text-[120px] font-black text-cyan-400 select-none">
          SAMEQUIZ
        </div>

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold uppercase tracking-wider mb-4">
            <Zap className="w-3.5 h-3.5 text-cyan-400 animate-bounce" /> Đấu Trường Đối Kháng Trí Tuệ 1v1
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-tight mb-4">
            ĐỐI ĐẦU <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-fuchsia-400 bg-clip-text text-transparent">CÙNG MỘT BỘ ĐỀ</span>, THỬ THÁCH TỐC ĐỘ NÃO BỘ
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6">
            20 giây mỗi câu. Người nhanh hơn đúng nhận <strong className="text-cyan-400 font-black">+3 điểm</strong>, người sau đúng <strong className="text-slate-200">+1 điểm</strong>. Loại bỏ gian lận tìm kiếm bằng phản xạ tri thức đích thực!
          </p>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => onOpenMatchmaking('random')}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-fuchsia-600 hover:from-cyan-400 hover:to-fuchsia-500 text-slate-950 font-black text-sm sm:text-base shadow-xl shadow-cyan-500/30 hover:scale-105 transition-all flex items-center gap-2.5 cursor-pointer"
            >
              <Swords className="w-5 h-5" />
              GHÉP TRẬN RANKED 1v1
            </button>
            <button
              onClick={onOpenPractice}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm sm:text-base shadow-lg shadow-emerald-500/20 hover:scale-105 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Target className="w-5 h-5" />
              LUYỆN TẬP 1 MÌNH (+COINS)
            </button>
            <button
              onClick={() => onOpenMatchmaking('friend')}
              className="px-5 py-3.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-100 font-bold text-sm hover:border-cyan-500/50 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Users className="w-4 h-4 text-cyan-400" />
              ĐẤU BẠN BÈ
            </button>
          </div>
        </div>
      </div>

      {/* Main Game Modes Grid */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-100 tracking-wide mb-4 flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-400" /> CÁC CHẾ ĐỘ THI ĐẤU & RÈN LUYỆN
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Mode 0: Solo Practice */}
          <div
            onClick={onOpenPractice}
            className="group glass-panel rounded-2xl p-5 border border-teal-500/30 hover:border-teal-400 cursor-pointer hover:shadow-xl hover:shadow-teal-500/10 transition-all duration-300 relative overflow-hidden"
          >
            <div className="w-11 h-11 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 mb-3 group-hover:scale-110 transition-transform">
              <Target className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white mb-1 group-hover:text-teal-300 transition-colors">
              Luyện Tập 1 Mình
            </h3>
            <p className="text-xs text-slate-400 mb-3">
              Tự chọn 15 chuyên mục, xem giải thích chi tiết, nhận thưởng +10 Coins/câu.
            </p>
            <div className="flex items-center text-xs font-bold text-teal-400 gap-1 group-hover:translate-x-1 transition-transform">
              Vào luyện tập <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* Mode 1: Ranked 1v1 */}
          <div
            onClick={() => onOpenMatchmaking('random')}
            className="group glass-panel rounded-2xl p-5 border border-cyan-500/20 hover:border-cyan-400 cursor-pointer hover:shadow-xl hover:shadow-cyan-500/10 transition-all duration-300 relative overflow-hidden"
          >
            <div className="w-11 h-11 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-3 group-hover:scale-110 transition-transform">
              <Swords className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white mb-1 group-hover:text-cyan-300 transition-colors">
              Đấu Hạng 1v1
            </h3>
            <p className="text-xs text-slate-400 mb-3">
              Cộng trừ ELO theo chuẩn quốc tế. Gặp gỡ các cao thủ cùng trình độ.
            </p>
            <div className="flex items-center text-xs font-bold text-cyan-400 gap-1 group-hover:translate-x-1 transition-transform">
              Ghép trận ngay <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* Mode 2: Friend PIN Battle */}
          <div
            onClick={() => onOpenMatchmaking('friend')}
            className="group glass-panel rounded-2xl p-5 border border-fuchsia-500/20 hover:border-fuchsia-400 cursor-pointer hover:shadow-xl hover:shadow-fuchsia-500/10 transition-all duration-300 relative overflow-hidden"
          >
            <div className="w-11 h-11 rounded-xl bg-fuchsia-500/10 border border-fuchsia-500/30 flex items-center justify-center text-fuchsia-400 mb-3 group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white mb-1 group-hover:text-fuchsia-300 transition-colors">
              Đấu Bạn Bè 1v1
            </h3>
            <p className="text-xs text-slate-400 mb-3">
              Tạo phòng hoặc nhập mã PIN để so tài đối kháng trực tiếp với bạn bè.
            </p>
            <div className="flex items-center text-xs font-bold text-fuchsia-400 gap-1 group-hover:translate-x-1 transition-transform">
              Vào phòng đấu <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* Mode 3: Split Screen 2P */}
          <div
            onClick={onOpenSplitScreen}
            className="group glass-panel rounded-2xl p-5 border border-purple-500/20 hover:border-purple-400 cursor-pointer hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 relative overflow-hidden"
          >
            <div className="w-11 h-11 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-3 group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white mb-1 group-hover:text-purple-300 transition-colors">
              2P Chia Màn Hình
            </h3>
            <p className="text-xs text-slate-400 mb-3">
              Chia đôi màn hình chơi cùng bạn bè trên máy tính / tablet / điện thoại.
            </p>
            <div className="flex items-center text-xs font-bold text-purple-400 gap-1 group-hover:translate-x-1 transition-transform">
              Chơi 2 người <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* Mode 4: Knockout Tournament */}
          <div
            onClick={onOpenTournament}
            className="group glass-panel rounded-2xl p-5 border border-amber-500/20 hover:border-amber-400 cursor-pointer hover:shadow-xl hover:shadow-amber-500/10 transition-all duration-300 relative overflow-hidden"
          >
            <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3 group-hover:scale-110 transition-transform">
              <Trophy className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white mb-1 group-hover:text-amber-300 transition-colors">
              Đại Hội Giải Đấu
            </h3>
            <p className="text-xs text-slate-400 mb-3">
              Nhánh Knockout 4 - 64 người, Free Win (Byes), Trọng tài xem trực tiếp.
            </p>
            <div className="flex items-center text-xs font-bold text-amber-400 gap-1 group-hover:translate-x-1 transition-transform">
              Sảnh giải đấu <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Public Strengths & Weaknesses Profiling Banner (Cannot be hidden) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Quick Public Radar Card */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-cyan-400" /> SỞ TRƯỜNG & SỞ ĐOẢN CÔNG KHAI (PUBLIC RADAR)
              </h3>
              <p className="text-xs text-slate-400">
                Dữ liệu tính từ tất cả các trận đấu đối kháng của bạn. Đối thủ có thể soi điểm yếu này khi đấu giải!
              </p>
            </div>
            <button
              onClick={onOpenProfile}
              className="text-xs font-bold text-cyan-400 hover:underline"
            >
              Xem chi tiết hồ sơ →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Top 3 Strengths */}
            <div className="bg-slate-900/60 rounded-xl p-4 border border-emerald-500/20">
              <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Crown className="w-4 h-4 text-emerald-400" /> Top 3 Sở Trường (Mạnh Nhất)
              </h4>
              <div className="space-y-2.5">
                {strengths.map((s, idx) => (
                  <div key={s.categoryId} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-200">#{idx + 1} {s.categoryName}</span>
                      <span className="text-emerald-400 font-bold">{s.winRate}% ({s.correct}/{s.total})</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                        style={{ width: `${s.winRate}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top 3 Weaknesses */}
            <div className="bg-slate-900/60 rounded-xl p-4 border border-red-500/20">
              <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-red-400" /> Top 3 Sở Đoản (Cần Luyện Thêm)
              </h4>
              <div className="space-y-2.5">
                {weaknesses.map((w, idx) => (
                  <div key={w.categoryId} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-200">#{idx + 1} {w.categoryName}</span>
                      <span className="text-red-400 font-bold">{w.winRate}% ({w.correct}/{w.total})</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-red-500 to-orange-400 rounded-full"
                        style={{ width: `${w.winRate}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Weekly Grand Live Event Callout */}
        <div className="glass-panel rounded-2xl p-6 border border-amber-500/30 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[11px] font-extrabold">
                SỰ KIỆN TUẦN
              </span>
              <span className="text-xs text-slate-400">Tối Thứ Bảy 20:00</span>
            </div>
            <h3 className="text-xl font-black text-amber-300 mb-2">
              Đại Chiến Vua Bóng Đá 2026
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Hơn 100 người cùng thi đấu trên cùng 1 câu hỏi! Công thức tính điểm đua Top Battle Royale <code className="text-amber-300 font-mono">3 + (N - Rank)</code> kịch tính. Quỹ thưởng 50.000 Coins!
            </p>
          </div>

          <button
            onClick={onOpenGrandEvent}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/20 hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
          >
            <Crown className="w-4 h-4 fill-current" /> XEM PHÒNG THI ĐẤU
          </button>
        </div>
      </div>
    </div>
  );
};
