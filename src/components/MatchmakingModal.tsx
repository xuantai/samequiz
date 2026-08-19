import React, { useState } from 'react';
import { X, Search, Sparkles, Key, Play, ShieldAlert, Cpu, Settings2 } from 'lucide-react';
import { MatchRules, Difficulty } from '../types/game';
import { CATEGORIES } from '../data/categories';

interface MatchmakingModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'random' | 'friend' | 'ai';
  onStartMatch: (rules: MatchRules, roomPin?: string, aiLevel?: 'easy' | 'medium' | 'hard') => void;
}

export const MatchmakingModal: React.FC<MatchmakingModalProps> = ({
  isOpen,
  onClose,
  mode,
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

  if (!isOpen) return null;

  const toggleCategory = (id: number) => {
    if (selectedCategories.includes(id)) {
      setSelectedCategories(selectedCategories.filter(c => c !== id));
    } else {
      setSelectedCategories([...selectedCategories, id]);
    }
  };

  const handleStart = () => {
    const rules: MatchRules = {
      difficulty,
      categoryIds: selectedCategories,
      lifelines,
      totalQuestions: 10,
      timePerQuestion: 30
    };
    onStartMatch(rules, roomPin.trim() || undefined, mode === 'ai' ? aiLevel : undefined);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg glass-panel rounded-2xl border border-cyan-500/30 p-6 shadow-2xl relative overflow-hidden">
        {/* Decorative Neon Header */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-cyan-500 via-fuchsia-500 to-amber-500" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <h3 className="text-2xl font-black text-slate-100 flex items-center justify-center gap-2">
            {mode === 'random' && <><Search className="w-6 h-6 text-cyan-400" /> Ghép Trận Ngẫu Nhiên</>}
            {mode === 'friend' && <><Key className="w-6 h-6 text-fuchsia-400" /> Phòng Đấu Bạn Bè 1v1</>}
            {mode === 'ai' && <><Cpu className="w-6 h-6 text-emerald-400" /> Đấu Với Trí Tuệ Nhân Tạo (AI)</>}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            {mode === 'random' && 'Đối đầu cùng bộ câu hỏi 10 câu - Bấm trước đúng 3 điểm, bấm sau đúng 1 điểm'}
            {mode === 'friend' && 'Nhập mã PIN hoặc tùy chỉnh luật đấu để cùng bạn bè so tài'}
            {mode === 'ai' && 'Luyện tập phản xạ trí tuệ với bot AI mô phỏng người thật'}
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

        {mode === 'ai' && (
          <div className="mb-4">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Cấp Độ Bot AI
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setAiLevel('easy')}
                className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                  aiLevel === 'easy' ? 'bg-emerald-500 text-slate-950 border-emerald-400' : 'bg-slate-900 text-slate-300 border-slate-800'
                }`}
              >
                🌱 Tập Sự (Dễ)
              </button>
              <button
                type="button"
                onClick={() => setAiLevel('medium')}
                className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                  aiLevel === 'medium' ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-slate-900 text-slate-300 border-slate-800'
                }`}
              >
                ⚔️ Cao Thủ (Vừa)
              </button>
              <button
                type="button"
                onClick={() => setAiLevel('hard')}
                className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                  aiLevel === 'hard' ? 'bg-red-500 text-slate-950 border-red-400' : 'bg-slate-900 text-slate-300 border-slate-800'
                }`}
              >
                🔥 Thần Đồng (Khó)
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
                className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                  difficulty === d.id ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md' : 'bg-slate-900 text-slate-300 border-slate-800'
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
            <Settings2 className="w-3.5 h-3.5 text-cyan-400" /> Quyền Trợ Giúp Kích Hoạt (Mỗi người 1 lần dùng)
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
                className="text-[11px] text-cyan-400 hover:underline"
              >
                Xóa lọc ({selectedCategories.length})
              </button>
            )}
          </div>
          <div className="max-h-32 overflow-y-auto pr-1 grid grid-cols-3 gap-1.5 text-xs">
            {CATEGORIES.map(cat => {
              const isSelected = selectedCategories.includes(cat.id);
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => toggleCategory(cat.id)}
                  className={`p-1.5 rounded-lg border text-left truncate transition-all ${
                    isSelected ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300' : 'bg-slate-900/60 border-slate-800 text-slate-400'
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
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-fuchsia-600 hover:from-cyan-400 hover:to-fuchsia-500 text-slate-950 font-black text-base shadow-xl shadow-cyan-500/20 hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
        >
          <Play className="w-5 h-5 fill-current" />
          {mode === 'random' ? 'TÌM TRẬN NGAY' : mode === 'friend' ? (roomPin ? 'VÀO PHÒNG' : 'TẠO PHÒNG MỚI') : 'BẮT ĐẦU ĐẤU AI'}
        </button>
      </div>
    </div>
  );
};
