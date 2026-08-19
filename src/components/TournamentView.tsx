import React, { useState } from 'react';
import { 
  Trophy, Users, Shield, Play, Plus, Eye, Home as HomeIcon, 
  Flame, Crown, ArrowRight, Settings, CheckCircle, ChevronRight 
} from 'lucide-react';
import { Tournament, TournamentMatch, PlayerProfile, MatchRules } from '../types/game';

interface TournamentViewProps {
  profile: PlayerProfile;
  onStartTournamentMatch: (p1: PlayerProfile, p2: PlayerProfile, rules: MatchRules) => void;
  onSpectateMatch: (p1: PlayerProfile, p2: PlayerProfile) => void;
}

export const TournamentView: React.FC<TournamentViewProps> = ({
  profile,
  onStartTournamentMatch,
  onSpectateMatch
}) => {
  const [activeTab, setActiveTab] = useState<'browse' | 'create' | 'bracket'>('browse');

  const [tournaments, setTournaments] = useState<Tournament[]>([
    {
      id: 'tour_101',
      name: '🏆 ĐẠI HỘI BÁT HÙNG - MÙA 1',
      maxSlots: 8,
      hostId: profile.id,
      isHostPlaying: true,
      rules: {
        difficulty: 'random',
        categoryIds: [],
        isHomeAway: true,
        lifelines: { fiftyFifty: true, hint: true, removeOne: true, reduceOpponentTime: true, addSelfTime: true },
        totalQuestions: 10,
        timePerQuestion: 30
      },
      participants: [
        profile,
        { id: 'p2', username: 'Quang Thần Đồng', avatar: '🧠', role: 'player', elo: 1850, offlineElo: 1850, coins: 5000, country: 'VN', isBanned: false, inventory: [], statsOnline: { totalQuestions: 100, correctQuestions: 80, categoryStats: {}, onlineWins: 15, onlineLosses: 5, offlineWins: 0, offlineLosses: 0, highestStreak: 5 }, statsOffline: { totalQuestions: 0, correctQuestions: 0, categoryStats: {}, onlineWins: 0, onlineLosses: 0, offlineWins: 0, offlineLosses: 0, highestStreak: 0 } },
        { id: 'p3', username: 'Hương Bách Khoa', avatar: '🌸', role: 'player', elo: 1690, offlineElo: 1690, coins: 3200, country: 'VN', isBanned: false, inventory: [], statsOnline: { totalQuestions: 80, correctQuestions: 60, categoryStats: {}, onlineWins: 7, onlineLosses: 3, offlineWins: 0, offlineLosses: 0, highestStreak: 4 }, statsOffline: { totalQuestions: 0, correctQuestions: 0, categoryStats: {}, onlineWins: 0, onlineLosses: 0, offlineWins: 0, offlineLosses: 0, highestStreak: 0 } },
        { id: 'p4', username: 'Alexander (UK)', avatar: '🦁', role: 'player', elo: 1580, offlineElo: 1580, coins: 2100, country: 'UK', isBanned: false, inventory: [], statsOnline: { totalQuestions: 50, correctQuestions: 35, categoryStats: {}, onlineWins: 4, onlineLosses: 4, offlineWins: 0, offlineLosses: 0, highestStreak: 3 }, statsOffline: { totalQuestions: 0, correctQuestions: 0, categoryStats: {}, onlineWins: 0, onlineLosses: 0, offlineWins: 0, offlineLosses: 0, highestStreak: 0 } },
        { id: 'p5', username: 'Minh Master', avatar: '👑', role: 'player', elo: 1720, offlineElo: 1720, coins: 4100, country: 'VN', isBanned: false, inventory: [], statsOnline: { totalQuestions: 90, correctQuestions: 75, categoryStats: {}, onlineWins: 9, onlineLosses: 3, offlineWins: 0, offlineLosses: 0, highestStreak: 6 }, statsOffline: { totalQuestions: 0, correctQuestions: 0, categoryStats: {}, onlineWins: 0, onlineLosses: 0, offlineWins: 0, offlineLosses: 0, highestStreak: 0 } },
        { id: 'p6', username: 'Linh Siêu Tốc', avatar: '⚡', role: 'player', elo: 1640, offlineElo: 1640, coins: 2900, country: 'VN', isBanned: false, inventory: [], statsOnline: { totalQuestions: 110, correctQuestions: 85, categoryStats: {}, onlineWins: 10, onlineLosses: 5, offlineWins: 0, offlineLosses: 0, highestStreak: 5 }, statsOffline: { totalQuestions: 0, correctQuestions: 0, categoryStats: {}, onlineWins: 0, onlineLosses: 0, offlineWins: 0, offlineLosses: 0, highestStreak: 0 } }
      ],
      matches: [],
      currentRound: 1,
      status: 'lobby',
      createdAt: Date.now()
    }
  ]);

  const [selectedTour, setSelectedTour] = useState<Tournament>(tournaments[0]);
  const [name, setName] = useState('Đại Hội Tranh Tài SameQuiz');
  const [maxSlots, setMaxSlots] = useState<4 | 8 | 16 | 32 | 64>(8);
  const [isHomeAway, setIsHomeAway] = useState(true);
  const [isHostPlaying, setIsHostPlaying] = useState(true);

  // Generate Dynamic Bracket with Free Win (Byes)
  const handleStartTournament = () => {
    const n = selectedTour.participants.length;
    let bracketSize = 4;
    if (n > 32) bracketSize = 64;
    else if (n > 16) bracketSize = 32;
    else if (n > 8) bracketSize = 16;
    else if (n > 4) bracketSize = 8;
    else bracketSize = 4;

    const participants = [...selectedTour.participants].sort(() => Math.random() - 0.5);
    const matches: TournamentMatch[] = [];
    const numFirstRoundMatches = bracketSize / 2;

    for (let i = 0; i < numFirstRoundMatches; i++) {
      const p1 = participants[i * 2] || null;
      const p2 = participants[i * 2 + 1] || null;
      const isBye = !p2 && p1;

      matches.push({
        id: `match_${selectedTour.id}_r1_${i}`,
        roundNumber: 1,
        roundName: bracketSize === 4 ? `Bán Kết ${i + 1}` : bracketSize === 8 ? `Tứ Kết ${i + 1}` : `Vòng 1 - Trận ${i + 1}`,
        matchIndex: i,
        player1: p1,
        player2: p2,
        score1: 0,
        score2: 0,
        winnerId: isBye && p1 ? p1.id : null,
        status: isBye ? 'bye' : 'in_progress',
        homePlayerId: p1 ? p1.id : undefined,
        leg: 1
      });
    }

    const updated = {
      ...selectedTour,
      matches,
      status: 'in_progress' as const,
      currentRound: 1
    };

    setSelectedTour(updated);
    setActiveTab('bracket');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel rounded-3xl p-6 border border-amber-500/30">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-black uppercase">
              TOURNAMENT KNOCKOUT
            </span>
            <span className="text-xs text-slate-400">Tứ Hùng (4) • Bát Hùng (8) • 16 • 32 • 64</span>
          </div>
          <h1 className="text-3xl font-black text-white mt-1">
            ĐẠI HỘI TRANH TÀI GIẢI ĐẤU
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('browse')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
              activeTab === 'browse' ? 'bg-amber-500 text-slate-950 font-black' : 'bg-slate-900 text-slate-300 border border-slate-800'
            }`}
          >
            Sảnh Giải Đấu
          </button>
          <button
            onClick={() => setActiveTab('bracket')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
              activeTab === 'bracket' ? 'bg-amber-500 text-slate-950 font-black' : 'bg-slate-900 text-slate-300 border border-slate-800'
            }`}
          >
            Sơ Đồ Nhánh Đấu
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" /> Tạo Giải Mới
          </button>
        </div>
      </div>

      {/* TAB 1: BROWSE & LOBBY */}
      {activeTab === 'browse' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 glass-panel rounded-3xl p-6 border border-slate-800 space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-black text-white">{selectedTour.name}</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Thể thức: Loại trực tiếp • Quy mô: <strong>{selectedTour.maxSlots} người</strong> • Sân nhà/Sân khách: <strong>{selectedTour.rules.isHomeAway ? 'BẬT (Lượt đi/về)' : 'TẮT'}</strong>
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold">
                {selectedTour.status === 'lobby' ? 'Đang Chờ Slot' : 'Đang Thi Đấu'}
              </span>
            </div>

            {/* Slots List */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-black text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-400" /> Danh Sách Người Tham Gia ({selectedTour.participants.length}/{selectedTour.maxSlots})
                </h3>
                <span className="text-xs text-slate-400">
                  {selectedTour.participants.length < selectedTour.maxSlots ? 'Hệ thống tự chia Free Win nếu không đủ người' : 'Đã đủ số lượng'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selectedTour.participants.map((p, idx) => (
                  <div
                    key={p.id}
                    className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-xs font-mono font-bold text-slate-400">
                        #{idx + 1}
                      </span>
                      <div className="text-2xl">{p.avatar}</div>
                      <div>
                        <div className="text-xs font-black text-slate-100">{p.username}</div>
                        <div className="text-[10px] text-cyan-400 font-mono font-semibold">ELO {p.elo} • {p.country}</div>
                      </div>
                    </div>

                    {p.id === selectedTour.hostId && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                        👑 Host
                      </span>
                    )}
                  </div>
                ))}

                {Array.from({ length: selectedTour.maxSlots - selectedTour.participants.length }).map((_, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl border-2 border-dashed border-slate-800/80 flex items-center justify-center text-slate-600 text-xs font-bold"
                  >
                    + Slot Trống #{selectedTour.participants.length + idx + 1} (Free Win nếu bắt đầu ngay)
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
              <button
                onClick={handleStartTournament}
                className="px-8 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/20 flex items-center gap-2 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" /> KHỞI TRANH GIẢI ĐẤU (CHIA CẶP TỰ ĐỘNG)
              </button>
            </div>
          </div>

          {/* Right rules */}
          <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-6">
            <h3 className="text-base font-black text-slate-100 uppercase flex items-center gap-2">
              <Shield className="w-5 h-5 text-cyan-400" /> QUYỀN TRỌNG TÀI & KHÁN GIẢ
            </h3>
            <div className="space-y-3 text-xs text-slate-300 bg-slate-900/60 p-4 rounded-2xl border border-slate-800 leading-relaxed">
              <p>👑 <strong>Host Trọng tài:</strong> Có thể ở ngoài xem toàn bộ diễn biến câu hỏi & điểm số từng cặp đấu trực tiếp mà không cần tham gia thi đấu.</p>
              <p>🏟️ <strong>Sân nhà / Sân khách:</strong> Người chơi sân nhà được ưu tiên chọn chủ đề ở lượt đi. Nếu hòa sẽ đá Hiệp Phụ & Bàn Thắng Vàng!</p>
              <p>🎁 <strong>Tự động Free Win (Bye):</strong> Nếu giải 16 người nhưng chỉ có 15 người chơi, 1 người may mắn sẽ được free win vào thẳng vòng trong.</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BRACKET */}
      {activeTab === 'bracket' && (
        <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 overflow-x-auto">
          <div className="min-w-[800px] space-y-8">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black text-white">SƠ ĐỒ NHÁNH ĐẤU LOẠI TRỰC TIẾP</h3>
                <p className="text-xs text-slate-400">Bấm "Xem Trực Tiếp" để trọng tài / khán giả theo dõi trận đấu</p>
              </div>
              <button
                onClick={() => setActiveTab('browse')}
                className="text-xs font-bold text-amber-400 hover:underline cursor-pointer"
              >
                ← Về Sảnh Giải
              </button>
            </div>

            <div className="grid grid-cols-3 gap-8 items-center">
              <div className="space-y-6">
                <div className="text-center font-black text-xs text-amber-400 uppercase tracking-widest">
                  VÒNG 1 (TỨ KẾT)
                </div>

                {selectedTour.matches.length > 0 ? (
                  selectedTour.matches.map((m) => (
                    <div
                      key={m.id}
                      className="glass-panel rounded-2xl p-4 border border-slate-700 space-y-3 relative group hover:border-amber-400 transition-all"
                    >
                      <div className="flex justify-between text-[11px] font-bold text-slate-400">
                        <span>{m.roundName}</span>
                        {m.status === 'bye' ? (
                          <span className="text-amber-400">Free Win (Bye)</span>
                        ) : (
                          <span className="text-cyan-400 font-mono">Đang diễn ra</span>
                        )}
                      </div>

                      <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/90 border border-slate-800">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{m.player1?.avatar || '👤'}</span>
                          <span className="text-xs font-bold text-slate-200 truncate max-w-[100px]">
                            {m.player1?.username || 'Chờ đối thủ'}
                          </span>
                        </div>
                        <span className="text-xs font-black font-mono text-cyan-400">{m.score1}</span>
                      </div>

                      <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/90 border border-slate-800">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{m.player2?.avatar || '👤'}</span>
                          <span className="text-xs font-bold text-slate-200 truncate max-w-[100px]">
                            {m.player2?.username || '(Trống - Bye)'}
                          </span>
                        </div>
                        <span className="text-xs font-black font-mono text-fuchsia-400">{m.score2}</span>
                      </div>

                      {m.status !== 'bye' && (
                        <div className="flex gap-2 pt-1">
                          {m.player1?.id === profile.id || m.player2?.id === profile.id ? (
                            <button
                              onClick={() => onStartTournamentMatch(m.player1!, m.player2!, selectedTour.rules)}
                              className="flex-1 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" /> Vào Thi Đấu
                            </button>
                          ) : (
                            <button
                              onClick={() => onSpectateMatch(m.player1!, m.player2!)}
                              className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" /> Xem Trực Tiếp
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-6 rounded-2xl border border-dashed border-slate-800 text-center text-xs text-slate-500">
                    Bấm "Khởi Tranh Giải Đấu" để tạo nhánh
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <div className="text-center font-black text-xs text-cyan-400 uppercase tracking-widest">
                  VÒNG 2 (BÁN KẾT)
                </div>
                <div className="glass-panel rounded-2xl p-4 border border-dashed border-slate-800 opacity-60 text-center text-xs text-slate-400 py-12">
                  ⏳ Đang chờ kết quả Vòng 1
                </div>
              </div>

              <div className="space-y-6">
                <div className="text-center font-black text-xs text-yellow-400 uppercase tracking-widest flex items-center justify-center gap-1">
                  <Crown className="w-4 h-4 text-yellow-400" /> TRẬN CHUNG KẾT
                </div>
                <div className="glass-panel rounded-2xl p-6 border-2 border-yellow-500/40 text-center space-y-3">
                  <Trophy className="w-10 h-10 text-yellow-400 mx-auto animate-bounce" />
                  <div className="text-xs font-extrabold text-white">CÚP VÔ ĐỊCH SAMEQUIZ</div>
                  <div className="text-[11px] text-amber-300 font-mono">+10.000 Coins & Khung Vàng</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CREATE */}
      {activeTab === 'create' && (
        <div className="max-w-2xl mx-auto glass-panel rounded-3xl p-8 border border-amber-500/30 space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-black text-white">TẠO GIẢI ĐẤU MỚI</h2>
            <p className="text-xs text-slate-400 mt-1">Thiết lập quy mô, thể thức Sân nhà/Sân khách và quyền Trọng tài</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Tên Giải Đấu
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-400 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Quy Mô Tối Đa (Không cần đủ người để bắt đầu)
              </label>
              <div className="grid grid-cols-5 gap-2">
                {[
                  { slots: 4, label: 'Tứ Hùng (4)' },
                  { slots: 8, label: 'Bát Hùng (8)' },
                  { slots: 16, label: '16 Người' },
                  { slots: 32, label: '32 Người' },
                  { slots: 64, label: '64 Người' }
                ].map(s => (
                  <button
                    key={s.slots}
                    type="button"
                    onClick={() => setMaxSlots(s.slots as any)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      maxSlots === s.slots ? 'bg-amber-500 text-slate-950 border-amber-400 font-black' : 'bg-slate-900 text-slate-300 border-slate-800'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isHomeAway}
                  onChange={e => setIsHomeAway(e.target.checked)}
                  className="accent-amber-500 w-4 h-4"
                />
                <div>
                  <div className="text-xs font-bold text-slate-100">Sân Nhà / Sân Khách</div>
                  <div className="text-[10px] text-slate-400">Lượt đi & về + Bàn thắng vàng</div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isHostPlaying}
                  onChange={e => setIsHostPlaying(e.target.checked)}
                  className="accent-amber-500 w-4 h-4"
                />
                <div>
                  <div className="text-xs font-bold text-slate-100">Host Tham Gia Thi Đấu</div>
                  <div className="text-[10px] text-slate-400">Tắt để chỉ làm Trọng tài</div>
                </div>
              </label>
            </div>
          </div>

          <button
            onClick={() => {
              const newTour: Tournament = {
                id: 'tour_' + Date.now(),
                name,
                maxSlots,
                hostId: profile.id,
                isHostPlaying,
                rules: {
                  difficulty: 'random',
                  categoryIds: [],
                  isHomeAway,
                  lifelines: { fiftyFifty: true, hint: true, removeOne: true, reduceOpponentTime: true, addSelfTime: true },
                  totalQuestions: 10,
                  timePerQuestion: 30
                },
                participants: isHostPlaying ? [profile] : [],
                matches: [],
                currentRound: 1,
                status: 'lobby',
                createdAt: Date.now()
              };
              setTournaments([newTour, ...tournaments]);
              setSelectedTour(newTour);
              setActiveTab('browse');
            }}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Trophy className="w-5 h-5" /> TẠO VÀ MỞ SẢNH GIẢI ĐẤU
          </button>
        </div>
      )}
    </div>
  );
};
