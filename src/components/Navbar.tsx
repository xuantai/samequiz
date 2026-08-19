import React from 'react';
import { Volume2, VolumeX, Shield, Coins, Trophy, ShoppingBag, User, Globe, Flame, LayoutDashboard } from 'lucide-react';
import { PlayerProfile } from '../types/game';
import { soundEngine } from '../services/soundEngine';

interface NavbarProps {
  profile: PlayerProfile;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  profile,
  activeTab,
  setActiveTab,
  isMuted,
  onToggleMute
}) => {
  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80 px-4 py-3 shadow-lg backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Logo */}
        <div 
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-cyan-500/30 group-hover:scale-105 transition-transform">
            <span className="text-2xl font-black text-white">⚡</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-black tracking-wider bg-gradient-to-r from-cyan-400 via-sky-300 to-fuchsia-400 bg-clip-text text-transparent uppercase">
                SameQuiz
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold">
                1v1
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Đấu Trường Trí Tuệ</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-900/70 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('home')}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'home' ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Flame className="w-4 h-4" /> Đấu Trường
          </button>
          <button
            onClick={() => setActiveTab('tournament')}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'tournament' ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Trophy className="w-4 h-4" /> Giải Đấu
          </button>
          <button
            onClick={() => setActiveTab('grand_event')}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'grand_event' ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30' : 'text-amber-400 hover:bg-slate-800/60'
            }`}
          >
            <Shield className="w-4 h-4" /> Đại Sự Kiện
          </button>
          <button
            onClick={() => setActiveTab('shop')}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'shop' ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <ShoppingBag className="w-4 h-4" /> Cửa Hàng
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'leaderboard' ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Globe className="w-4 h-4" /> Xếp Hạng
          </button>
        </nav>

        {/* User Stats & Controls */}
        <div className="flex items-center gap-3">
          {/* Coins badge */}
          <div className="flex items-center gap-1.5 bg-amber-950/40 border border-amber-500/40 px-3 py-1 rounded-full shadow-inner">
            <Coins className="w-4 h-4 text-amber-400 animate-pulse" />
            <span className="font-extrabold text-amber-300 text-sm tracking-wide">
              {profile.coins.toLocaleString()}
            </span>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={onToggleMute}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-cyan-400 hover:border-cyan-500/40 transition-colors"
            title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>

          {/* User Profile Button */}
          <div
            onClick={() => setActiveTab('profile')}
            className="flex items-center gap-2 pl-2 pr-3 py-1 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 cursor-pointer transition-all group"
          >
            <div className={`w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-lg border-2 ${profile.avatarFrame || 'border-cyan-500'}`}>
              {profile.avatar}
            </div>
            <div className="text-left">
              <div className="flex items-center gap-1">
                <span className={`text-xs font-bold truncate max-w-[90px] ${profile.titleColor || 'text-slate-100'}`}>
                  {profile.username}
                </span>
                <span className="text-[10px] px-1 rounded bg-slate-800 text-slate-400 font-mono">
                  {profile.country}
                </span>
              </div>
              <div className="text-[10px] font-mono text-cyan-400 font-semibold">
                ELO {profile.elo}
              </div>
            </div>
          </div>

          {/* Master Admin Portal link */}
          <button
            onClick={() => setActiveTab('master_admin')}
            className="p-2 rounded-lg bg-fuchsia-950/50 border border-fuchsia-500/40 text-fuchsia-300 hover:bg-fuchsia-900/50 hover:text-white transition-all text-xs font-bold flex items-center gap-1"
            title="Trang Quản Trị Viên (Admin)"
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-fuchsia-400" />
            <span className="hidden sm:inline">Admin</span>
          </button>
        </div>
      </div>
    </header>
  );
};
