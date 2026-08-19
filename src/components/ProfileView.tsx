import React, { useState } from 'react';
import { Trophy, Coins, Target, Shield, Flame, Crown, Check, Edit3, Sparkles } from 'lucide-react';
import { PlayerProfile } from '../types/game';
import { CATEGORIES } from '../data/categories';
import { getCategoryProficiencies, updatePlayerProfile } from '../services/storageService';

interface ProfileViewProps {
  profile: PlayerProfile;
  onUpdateProfile: (updated: PlayerProfile) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ profile, onUpdateProfile }) => {
  const [activeTab, setActiveTab] = useState<'online' | 'offline'>('online');
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(profile.username);
  const [editAvatar, setEditAvatar] = useState(profile.avatar);

  const stats = activeTab === 'online' ? profile.statsOnline : profile.statsOffline;
  const proficiencies = getCategoryProficiencies(stats);

  const sorted = [...proficiencies].sort((a, b) => b.winRate - a.winRate);
  const strengths = sorted.slice(0, 3);
  const weaknesses = sorted.slice(-3).reverse();

  const handleSave = () => {
    const updated = updatePlayerProfile({
      username: editName.trim() || profile.username,
      avatar: editAvatar
    });
    onUpdateProfile(updated);
    setIsEditing(false);
  };

  const AVATAR_OPTIONS = ['⚡', '🧠', '🌸', '🦁', '👑', '🎯', '🔥', '🌌', '🚀', '🐱', '🐺', '🐉'];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
      <div className="glass-panel-glow rounded-3xl p-8 border border-cyan-500/30 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
          <div className="relative">
            <div className={`w-24 h-24 rounded-3xl bg-slate-900 flex items-center justify-center text-5xl border-4 ${profile.avatarFrame || 'border-cyan-500'}`}>
              {profile.avatar}
            </div>
            {profile.equippedGlow && (
              <div className="absolute inset-0 rounded-3xl bg-cyan-400/20 blur-xl -z-10" />
            )}
          </div>

          <div>
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <h1 className={`text-2xl sm:text-3xl font-black ${profile.titleColor || 'text-white'}`}>
                {profile.username}
              </h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono font-bold">
                {profile.country}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-1">ID: {profile.id} • Thành viên SameQuiz</p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-3">
              <div className="px-3 py-1 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-black">
                ELO {profile.elo}
              </div>
              <div className="px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono font-black flex items-center gap-1">
                <Coins className="w-3.5 h-3.5" /> {profile.coins.toLocaleString()} Coins
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsEditing(!isEditing)}
          className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
        >
          <Edit3 className="w-3.5 h-3.5 text-cyan-400" /> {isEditing ? 'Hủy' : 'Đổi Tên & Avatar'}
        </button>
      </div>

      {isEditing && (
        <div className="glass-panel rounded-2xl p-6 border border-cyan-500/40 space-y-4 animate-fade-in">
          <h3 className="text-sm font-bold text-cyan-300 uppercase">Chỉnh Sửa Hồ Sơ Cá Nhân</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">Tên Hiển Thị</label>
              <input
                type="text"
                value={editName}
                onChange={e => setEditName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-100 font-bold focus:outline-none focus:border-cyan-400"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">Chọn Avatar</label>
              <div className="flex flex-wrap gap-2">
                {AVATAR_OPTIONS.map(a => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setEditAvatar(a)}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg border ${
                      editAvatar === a ? 'bg-cyan-500/20 border-cyan-400 scale-110' : 'bg-slate-900 border-slate-800'
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <button
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-black text-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Check className="w-4 h-4" /> Lưu Thay Đổi
          </button>
        </div>
      )}

      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('online')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'online' ? 'bg-cyan-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
          }`}
        >
          🌐 Thống Kê Đấu Online ({profile.statsOnline.totalMatches} trận)
        </button>
        <button
          onClick={() => setActiveTab('offline')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'offline' ? 'bg-cyan-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
          }`}
        >
          🤖 Thống Kê Đấu AI / Offline ({profile.statsOffline.totalMatches} trận)
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel rounded-3xl p-6 border border-emerald-500/30 space-y-4">
          <h3 className="text-sm font-black text-emerald-400 uppercase tracking-wider flex items-center gap-2">
            <Crown className="w-4 h-4 text-emerald-400" /> TOP 3 SỞ TRƯỜNG (MẠNH NHẤT - CÔNG KHAI)
          </h3>
          <div className="space-y-3">
            {strengths.map((s, idx) => (
              <div key={s.categoryId} className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-200">#{idx + 1} {s.categoryName}</span>
                  <span className="text-emerald-400 font-mono">{s.winRate}% ({s.correct}/{s.total} câu)</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full" style={{ width: `${s.winRate}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel rounded-3xl p-6 border border-red-500/30 space-y-4">
          <h3 className="text-sm font-black text-red-400 uppercase tracking-wider flex items-center gap-2">
            <Shield className="w-4 h-4 text-red-400" /> TOP 3 SỞ ĐOẢN (ĐIỂM YẾU - CÔNG KHAI)
          </h3>
          <div className="space-y-3">
            {weaknesses.map((w, idx) => (
              <div key={w.categoryId} className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-200">#{idx + 1} {w.categoryName}</span>
                  <span className="text-red-400 font-mono">{w.winRate}% ({w.correct}/{w.total} câu)</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-red-500 to-orange-400 rounded-full" style={{ width: `${w.winRate}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6">
        <div>
          <h3 className="text-lg font-black text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-cyan-400" /> BẢNG CHI TIẾT TẤT CẢ 15 LĨNH VỰC TRI THỨC
          </h3>
          <p className="text-xs text-slate-400">Tỉ lệ chính xác và số câu đã trả lời đối kháng trên từng lĩnh vực</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {proficiencies.map(p => (
            <div key={p.categoryId} className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-slate-200">{p.categoryName}</span>
                <span className="text-cyan-400 font-mono">{p.winRate}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${p.winRate}%` }} />
              </div>
              <div className="text-[10px] text-slate-400 text-right font-mono">
                {p.correct}/{p.total} câu đúng
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
