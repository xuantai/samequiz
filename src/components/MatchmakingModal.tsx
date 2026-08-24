import React, { useState, useEffect } from 'react';
import { X, Search, Sparkles, Key, Play, ShieldAlert, Cpu, Settings2, Loader2, Radio, Bot, Users } from 'lucide-react';
import { MatchRules, Difficulty, PlayerProfile } from '../types/game';
import { CATEGORIES } from '../data/categories';
import { getSocket } from '../services/socketService';

interface MatchmakingModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'random' | 'friend' | 'ai';
  profile: PlayerProfile;
  onStartMatch: (rules: MatchRules, roomPin?: string, aiLevel?: 'easy' | 'medium' | 'hard', matchedOpponent?: PlayerProfile) => void;
}

export const MatchmakingModal: React.FC<MatchmakingModalProps> = ({
  isOpen,
  onClose,
  mode,
  profile,
  onStartMatch
}) => {
  const [difficulty, setDifficulty] = useState<Difficulty>('random');
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [roomPin, setRoomPin] = useState('');
  const [aiLevel, setAiLevel] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [lifelines, setLifelines] = useState({
    fiftyFifty: true,
    hint: true,
    removeOne: true,
    reduceOpponentTime: true,
    addSelfTime: true
  });

  // Searching State
  const [isSearching, setIsSearching] = useState(false);
  const [searchSeconds, setSearchSeconds] = useState(0);

  useEffect(() => {
    let timer: any;
    if (isSearching) {
      timer = setInterval(() => {
        setSearchSeconds(s => s + 1);
      }, 1000);
    } else {
      setSearchSeconds(0);
    }
    return () => clearInterval(timer);
  }, [isSearching]);

  // Socket.IO Matchmaking Listener
  useEffect(() => {
    if (!isOpen) {
      setIsSearching(false);
      return;
    }

    const socket = getSocket();

    const handleMatchFound = (data: { roomId: string; players: PlayerProfile[]; rules: MatchRules }) => {
      console.log('🎉 MATCH FOUND VIA SOCKET:', data);
      setIsSearching(false);
      const opponent = data.players.find(p => p.id !== profile.id) || data.players[0];
      onStartMatch(data.rules || getActiveRules(), data.roomId, undefined, opponent);
    };

    socket.on('match_found', handleMatchFound);

    return () => {
      socket.off('match_found', handleMatchFound);
    };
  }, [isOpen, profile.id]);

  if (!isOpen) return null;

  const toggleCategory = (id: number) => {
    if (selectedCategories.includes(id)) {
      setSelectedCategories(selectedCategories.filter(c => c !== id));
    } else {
      setSelectedCategories([...selectedCategories, id]);
    }
  };

  const getActiveRules = (): MatchRules => ({
    difficulty,
    categoryIds: selectedCategories,
    lifelines,
    totalQuestions: 10,
    timePerQuestion: 20
  });

  const handleStart = () => {
    const rules = getActiveRules();

    if (mode === 'ai') {
      const aiOpponent: PlayerProfile = {
        id: 'bot_ai_' + aiLevel,
        username: aiLevel === 'hard' ? 'AI Bot Thần Đồng (Hard)' : aiLevel === 'easy' ? 'AI Bot Tập Sự (Easy)' : 'AI Bot Cao Thủ (Medium)',
        avatar: '🤖',
        country: 'VN',
        coins: 1000,
        elo: aiLevel === 'hard' ? 1800 : aiLevel === 'easy' ? 900 : 1350,
        offlineElo: 1200,
        inventory: [],
        statsOnline: { totalQuestions: 0, correctQuestions: 0, categoryStats: {}, onlineWins: 0, onlineLosses: 0, offlineWins: 0, offlineLosses: 0, highestStreak: 0 },
        statsOffline: { totalQuestions: 0, correctQuestions: 0, categoryStats: {}, onlineWins: 0, onlineLosses: 0, offlineWins: 0, offlineLosses: 0, highestStreak: 0 }
      };
      onStartMatch(rules, undefined, aiLevel, aiOpponent);
      return;
    }

    if (mode === 'random') {
      setIsSearching(true);
      const socket = getSocket();
      socket.emit('find_match', { rules, playerProfile: profile });
      return;
    }

    if (mode === 'friend') {
      onStartMatch(rules, roomPin.trim() || undefined);
    }
  };

  const handleCancelSearch = () => {
    setIsSearching(false);
    const socket = getSocket();
    socket.emit('cancel_match', { playerId: profile.id });
  };

  const handlePlayAiFallback = () => {
    handleCancelSearch();
    const rules = getActiveRules();
    const aiOpponent: PlayerProfile = {
      id: 'bot_ai_' + aiLevel,
      username: aiLevel === 'hard' ? 'AI Bot Thần Đồng (Hard)' : aiLevel === 'easy' ? 'AI Bot Tập Sự (Easy)' : 'AI Bot Cao Thủ (Medium)',
      avatar: '🤖',
      country: 'VN',
      coins: 1000,
      elo: aiLevel === 'hard' ? 1800 : aiLevel === 'easy' ? 900 : 1350,
      offlineElo: 1200,
      inventory: [],
      statsOnline: { totalQuestions: 0, correctQuestions: 0, categoryStats: {}, onlineWins: 0, onlineLosses: 0, offlineWins: 0, offlineLosses: 0, highestStreak: 0 },
      statsOffline: { totalQuestions: 0, correctQuestions: 0, categoryStats: {}, onlineWins: 0, onlineLosses: 0, offlineWins: 0, offlineLosses: 0, highestStreak: 0 }
    };
    onStartMatch(rules, undefined, aiLevel, aiOpponent);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg glass-panel rounded-3xl border border-cyan-500/30 p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Decorative Neon Header */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-cyan-500 via-fuchsia-500 to-amber-500" />

        <button
          onClick={() => {
            if (isSearching) handleCancelSearch();
            onClose();
          }}
          className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {isSearching ? (
          /* RADAR SEARCHING SCREEN */
          <div className="py-6 text-center space-y-6 animate-fade-in">
            <div className="relative w-36 h-36 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-cyan-500/30 animate-ping opacity-60" />
              <div className="absolute inset-4 rounded-full border-2 border-fuchsia-500/40 animate-pulse" />
              <div className="w-20 h-20 rounded-full bg-slate-900 border-2 border-cyan-400 flex items-center justify-center text-4xl shadow-xl shadow-cyan-500/30 z-10">
                {profile.avatar || '🧠'}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-center gap-2 text-cyan-300 font-bold text-xs uppercase tracking-wider">
                <Radio className="w-4 h-4 text-cyan-400 animate-spin" />
                <span>Đang quét tìm đối thủ trực tuyến ({searchSeconds}s)...</span>
              </div>
              <h3 className="text-xl font-black text-white mt-1">ĐANG TÌM NGƯỜI CHƠI THẬT</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                Hệ thống đang ghép cặp bạn với người chơi khác cùng thời gian thực qua máy chủ...
              </p>
            </div>

            {searchSeconds >= 5 && (
              <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-left space-y-3 animate-fade-in">
                <div className="flex items-start gap-2">
                  <Bot className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <strong className="text-amber-300 block">Chưa có người chơi nào bấm tìm trận cùng lúc</strong>
                    <span className="text-slate-300 text-[11px]">
                      Bạn có thể chuyển sang đấu với <strong>AI Bot Luyện Tập</strong> (nhãn 🤖 rõ ràng) hoặc tiếp tục chờ người chơi thật vào phòng.
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={handlePlayAiFallback}
                    className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-black text-xs hover:scale-[1.02] transition-transform cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Bot className="w-4 h-4" /> Đấu Với AI Bot ({aiLevel})
                  </button>
                  <button
                    onClick={handleCancelSearch}
                    className="py-2 px-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-bold hover:text-rose-400 cursor-pointer"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            )}

            {searchSeconds < 5 && (
              <button
                onClick={handleCancelSearch}
                className="px-6 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white text-xs font-bold cursor-pointer"
              >
                Hủy Tìm Kiếm
              </button>
            )}
          </div>
        ) : (
          /* CONFIG SCREEN */
          <div>
            <div className="text-center mb-6">
              <h3 className="text-2xl font-black text-slate-100 flex items-center justify-center gap-2">
                {mode === 'random' && <><Search className="w-6 h-6 text-cyan-400" /> Ghép Trận Ngẫu Nhiên (Người Thật)</>}
                {mode === 'friend' && <><Key className="w-6 h-6 text-fuchsia-400" /> Phòng Đấu Bạn Bè 1v1</>}
                {mode === 'ai' && <><Cpu className="w-6 h-6 text-emerald-400" /> Đấu Với AI Bot Luyện Tập</>}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {mode === 'random' && 'Hệ thống quét và ghép nối 1v1 trực tiếp với người chơi thật trực tuyến'}
                {mode === 'friend' && 'Nhập mã PIN hoặc tự tạo phòng để cùng bạn bè so tài'}
                {mode === 'ai' && 'Đấu phản xạ với AI Bot (dán nhãn 🤖 rõ ràng, phân cấp độ)'}
              </p>
            </div>

            {mode === 'friend' && (
              <div className="mb-4">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Mã Phòng (Room PIN)
                </label>
                <input
                  type="text"
                  placeholder="VD: 889922 (Để trống để tự tạo phòng mới)"
                  value={roomPin}
                  onChange={e => setRoomPin(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-cyan-300 font-mono focus:outline-none focus:border-cyan-400"
                />
              </div>
            )}

            {(mode === 'ai' || mode === 'random') && (
              <div className="mb-4">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Cấp Độ AI Dự Phòng
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setAiLevel('easy')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      aiLevel === 'easy' ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-black' : 'bg-slate-900 text-slate-300 border-slate-800'
                    }`}
                  >
                    🌱 AI Tập Sự
                  </button>
                  <button
                    type="button"
                    onClick={() => setAiLevel('medium')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      aiLevel === 'medium' ? 'bg-amber-500 text-slate-950 border-amber-400 font-black' : 'bg-slate-900 text-slate-300 border-slate-800'
                    }`}
                  >
                    ⚔️ AI Cao Thủ
                  </button>
                  <button
                    type="button"
                    onClick={() => setAiLevel('hard')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      aiLevel === 'hard' ? 'bg-red-500 text-slate-950 border-red-400 font-black' : 'bg-slate-900 text-slate-300 border-slate-800'
                    }`}
                  >
                    🔥 AI Thần Đồng
                  </button>
                </div>
              </div>
            )}

            {/* Difficulty Selection */}
            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Độ Khó Câu Hỏi
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'random', label: '🎲 Ngẫu Nhiên' },
                  { id: 'easy', label: '🟢 Dễ' },
                  { id: 'medium', label: '🟡 Vừa' },
                  { id: 'hard', label: '🔴 Khó' }
                ].map(d => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setDifficulty(d.id as Difficulty)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      difficulty === d.id ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md font-black' : 'bg-slate-900 text-slate-300 border-slate-800'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 5 Lifelines Customization */}
            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Settings2 className="w-3.5 h-3.5 text-cyan-400" /> Quyền Trợ Giúp (Mỗi người 1 lần dùng)
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/60 border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={lifelines.fiftyFifty}
                    onChange={e => setLifelines({ ...lifelines, fiftyFifty: e.target.checked })}
                    className="accent-cyan-500"
                  />
                  <span>🎯 50:50 (Bỏ 2 sai)</span>
                </label>
                <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/60 border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={lifelines.hint}
                    onChange={e => setLifelines({ ...lifelines, hint: e.target.checked })}
                    className="accent-cyan-500"
                  />
                  <span>💡 Xem Gợi Ý</span>
                </label>
                <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/60 border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={lifelines.removeOne}
                    onChange={e => setLifelines({ ...lifelines, removeOne: e.target.checked })}
                    className="accent-cyan-500"
                  />
                  <span>❌ Bỏ 1 sai</span>
                </label>
                <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/60 border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={lifelines.reduceOpponentTime}
                    onChange={e => setLifelines({ ...lifelines, reduceOpponentTime: e.target.checked })}
                    className="accent-cyan-500"
                  />
                  <span>⏳ Trừ 10s đối thủ</span>
                </label>
                <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/60 border border-slate-800 cursor-pointer col-span-2">
                  <input
                    type="checkbox"
                    checked={lifelines.addSelfTime}
                    onChange={e => setLifelines({ ...lifelines, addSelfTime: e.target.checked })}
                    className="accent-cyan-500"
                  />
                  <span>⏰ Cộng 10s của mình</span>
                </label>
              </div>
            </div>

            {/* Categories Selection */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Chọn Lĩnh Vực (Để trống để lấy toàn bộ 15 lĩnh vực)
                </label>
                {selectedCategories.length > 0 && (
                  <button
                    onClick={() => setSelectedCategories([])}
                    className="text-[11px] text-cyan-400 hover:underline cursor-pointer"
                  >
                    Xóa lọc ({selectedCategories.length})
                  </button>
                )}
              </div>
              <div className="max-h-28 overflow-y-auto pr-1 grid grid-cols-3 gap-1.5 text-xs">
                {CATEGORIES.map(cat => {
                  const isSelected = selectedCategories.includes(cat.id);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => toggleCategory(cat.id)}
                      className={`p-1.5 rounded-lg border text-left truncate transition-all cursor-pointer ${
                        isSelected ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold' : 'bg-slate-900/60 border-slate-800 text-slate-400'
                      }`}
                    >
                      {cat.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Start button */}
            <button
              onClick={handleStart}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-fuchsia-600 hover:from-cyan-400 hover:to-fuchsia-500 text-slate-950 font-black text-base shadow-xl shadow-cyan-500/20 hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 cursor-pointer"
            >
              <Play className="w-5 h-5 fill-current" />
              {mode === 'random' ? 'TÌM ĐỐI THỦ THẬT NGAY' : mode === 'friend' ? (roomPin ? 'VÀO PHÒNG' : 'TẠO PHÒNG MỚI') : 'BẮT ĐẦU ĐẤU AI BOT'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
