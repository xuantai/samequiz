import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { PlayerProfile } from '../types/game';

interface LeaderboardViewProps {
  profile: PlayerProfile;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({ profile }) => {
  const [activeTab, setActiveTab] = useState<'online' | 'offline'>('online');
  const [search, setSearch] = useState('');

  const onlineLeaderboard = [
    { rank: 1, name: 'Quang Thần Đồng', avatar: '🧠', elo: 2450, wins: 142, matches: 160, country: 'VN' },
    { rank: 2, name: 'Hương Bách Khoa', avatar: '🌸', elo: 2320, wins: 120, matches: 145, country: 'VN' },
    { rank: 3, name: 'Minh Master', avatar: '👑', elo: 2180, wins: 98, matches: 120, country: 'VN' },
    { rank: 4, name: 'Alexander (UK)', avatar: '🦁', elo: 2050, wins: 85, matches: 110, country: 'UK' },
    { rank: 5, name: 'Linh Siêu Tốc', avatar: '⚡', elo: 1940, wins: 76, matches: 98, country: 'VN' },
    { rank: 6, name: profile.username, avatar: profile.avatar, elo: profile.elo, wins: profile.statsOnline.wins, matches: profile.statsOnline.totalMatches, country: profile.country },
    { rank: 7, name: 'Bình Chiến Binh', avatar: '⚔️', elo: 1820, wins: 64, matches: 90, country: 'VN' },
    { rank: 8, name: 'Trang Einstein', avatar: '🌌', elo: 1750, wins: 50, matches: 75, country: 'VN' }
  ];

  const offlineLeaderboard = [
    { rank: 1, name: 'Quang Thần Đồng', avatar: '🧠', wins: 88, matches: 90, country: 'VN' },
    { rank: 2, name: profile.username, avatar: profile.avatar, wins: profile.statsOffline.wins, matches: profile.statsOffline.totalMatches, country: profile.country },
    { rank: 3, name: 'Hương Bách Khoa', avatar: '🌸', wins: 45, matches: 50, country: 'VN' }
  ];

  const list = (activeTab === 'online' ? onlineLeaderboard : offlineLeaderboard)
    .filter(u => u.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel rounded-3xl p-6 border border-cyan-500/30">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-black uppercase">
              HALL OF FAME
            </span>
            <span className="text-xs text-slate-400">Bảng Vinh Danh Các Bậc Thầy Trí Tuệ</span>
          </div>
          <h1 className="text-3xl font-black text-white mt-1">BẢNG XẾP HẠNG CAO THỦ</h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('online')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
              activeTab === 'online' ? 'bg-cyan-500 text-slate-950 font-black' : 'bg-slate-900 text-slate-300 border border-slate-800'
            }`}
          >
            🌐 Xếp Hạng Online (ELO)
          </button>
          <button
            onClick={() => setActiveTab('offline')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
              activeTab === 'offline' ? 'bg-cyan-500 text-slate-950 font-black' : 'bg-slate-900 text-slate-300 border border-slate-800'
            }`}
          >
            🤖 Xếp Hạng AI & Solo
          </button>
        </div>
      </div>

      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-4">
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2.5">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm người chơi theo tên..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-transparent text-sm text-slate-100 focus:outline-none"
          />
        </div>

        <div className="space-y-2">
          {list.map((u) => {
            const isMe = u.name === profile.username;

            return (
              <div
                key={u.rank + u.name}
                className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                  isMe ? 'bg-cyan-500/10 border-cyan-400 shadow-md shadow-cyan-500/10' : 'bg-slate-900/60 border-slate-800'
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-mono font-black text-xs ${
                    u.rank === 1 ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/40' : u.rank === 2 ? 'bg-slate-300 text-slate-950' : u.rank === 3 ? 'bg-amber-700 text-white' : 'bg-slate-800 text-slate-400'
                  }`}>
                    #{u.rank}
                  </span>
                  <span className="text-2xl">{u.avatar}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-slate-100">{u.name}</span>
                      {isMe && <span className="text-[10px] px-1.5 rounded bg-cyan-500/20 text-cyan-300 font-bold">BẠN</span>}
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">{u.country} • {u.wins} Thắng / {u.matches} Trận</span>
                  </div>
                </div>

                <div className="text-right font-mono font-black">
                  {activeTab === 'online' ? (
                    <span className="text-base text-cyan-400">{(u as any).elo} ELO</span>
                  ) : (
                    <span className="text-base text-emerald-400">{u.wins} Trận Thắng</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
