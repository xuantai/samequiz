import React, { useState, useEffect } from 'react';
import { Search, Trophy, Loader2, Sparkles, UserCheck, Flame } from 'lucide-react';
import { PlayerProfile } from '../types/game';

interface LeaderboardViewProps {
  profile: PlayerProfile;
}

interface LeaderboardEntry {
  rank: number;
  id: string;
  name: string;
  avatar: string;
  avatarFrame?: string;
  country: string;
  coins: number;
  elo: number;
  wins: number;
  losses: number;
  matches: number;
  highestStreak: number;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({ profile }) => {
  const [activeTab, setActiveTab] = useState<'online' | 'offline'>('online');
  const [search, setSearch] = useState('');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    fetch(`/api/leaderboard?type=${activeTab}`)
      .then(res => res.json())
      .then(data => {
        if (isMounted && data.success && Array.isArray(data.leaderboard)) {
          setLeaderboard(data.leaderboard);
        }
      })
      .catch(err => {
        console.error('Lỗi tải bảng xếp hạng:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeTab]);

  const list = leaderboard.filter(u => u.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel rounded-3xl p-6 border border-cyan-500/30">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-black uppercase">
              HALL OF FAME (SUPABASE REALTIME)
            </span>
            <span className="text-xs text-slate-400">Bảng Vinh Danh Các Bậc Thầy Trí Tuệ Thật</span>
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
            🧘 Xếp Hạng Luyện Tập Solo
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

        {loading ? (
          <div className="py-16 text-center text-slate-400 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-cyan-400" />
            <p className="text-sm font-bold">Đang tải bảng xếp hạng từ Supabase...</p>
          </div>
        ) : list.length === 0 ? (
          <div className="py-16 text-center text-slate-400 space-y-4 bg-slate-900/40 rounded-3xl border border-slate-800/80 p-8">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto text-3xl text-cyan-400">
              🏆
            </div>
            <div>
              <h3 className="text-base font-black text-white">Chưa có người chơi nào trên bảng xếp hạng</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                Hãy đăng ký tài khoản và hoàn thành các trận đấu 1v1 hoặc Luyện tập để trở thành người đứng đầu bảng vinh danh!
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {list.map((u) => {
              const isMe = u.name.toLowerCase() === profile.username.toLowerCase() || u.id === profile.id;

              return (
                <div
                  key={u.id || u.rank + u.name}
                  className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                    isMe ? 'bg-cyan-500/15 border-cyan-400 shadow-lg shadow-cyan-500/10' : 'bg-slate-900/60 border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-mono font-black text-xs ${
                      u.rank === 1 ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/40' : u.rank === 2 ? 'bg-slate-300 text-slate-950' : u.rank === 3 ? 'bg-amber-700 text-white' : 'bg-slate-800 text-slate-400'
                    }`}>
                      #{u.rank}
                    </span>
                    <span className="text-2xl">{u.avatar || '🧠'}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-slate-100">{u.name}</span>
                        {isMe && <span className="text-[10px] px-1.5 rounded bg-cyan-500/20 text-cyan-300 font-bold">BẠN</span>}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {u.country} • {u.wins} Thắng / {u.matches} Câu
                        {u.highestStreak > 0 && ` • 🔥 Chuỗi ${u.highestStreak}`}
                      </span>
                    </div>
                  </div>

                  <div className="text-right font-mono font-black">
                    <span className="text-base text-cyan-400">{u.elo} ELO</span>
                    <div className="text-[10px] text-amber-400 font-normal">💰 {u.coins.toLocaleString()} Coins</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

