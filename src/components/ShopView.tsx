import React, { useState } from 'react';
import { Coins, Sparkles } from 'lucide-react';
import { PlayerProfile, ShopItem } from '../types/game';

interface ShopViewProps {
  profile: PlayerProfile;
  onUpdateProfile: (updated: PlayerProfile) => void;
}

export const ShopView: React.FC<ShopViewProps> = ({ profile, onUpdateProfile }) => {
  const [items] = useState<ShopItem[]>([
    { id: 'frame_gold', name: 'Khung Vàng Hoàng Kim', description: 'Viền vàng lấp lánh khẳng định đẳng cấp cao thủ', price: 2000, category: 'frame', value: 'border-yellow-400 shadow-yellow-400/50', icon: '👑' },
    { id: 'frame_cyber', name: 'Khung Cyber Neon', description: 'Hiệu ứng ánh sáng Cyberpunk rực rỡ', price: 3500, category: 'frame', value: 'border-cyan-400 shadow-cyan-400/50', icon: '⚡' },
    { id: 'frame_fire', name: 'Khung Rồng Lửa', description: 'Ngọn lửa rực cháy bao quanh avatar', price: 5000, category: 'frame', value: 'border-rose-500 shadow-rose-500/50', icon: '🔥' },
    { id: 'title_master', name: 'Đại Tông Sư', description: 'Danh hiệu phát sáng chữ vàng trên đầu', price: 1500, category: 'title', value: 'text-amber-300 font-extrabold', icon: '🎖️' },
    { id: 'title_god', name: 'Vua Tri Thức', description: 'Danh hiệu cao quý nhất SameQuiz', price: 8000, category: 'title', value: 'text-fuchsia-400 font-extrabold animate-pulse', icon: '🌟' },
    { id: 'skin_cyber_warrior', name: 'Chiến Binh Cyber', description: 'Trang phục Avatar Cyberpunk 2077', price: 1000, category: 'avatar', value: '🤖', icon: '🤖' },
    { id: 'skin_dragon', name: 'Long Thần', description: 'Trang phục Rồng Thần Huyền Thoại', price: 4000, category: 'avatar', value: '🐉', icon: '🐉' },
    { id: 'item_rename', name: 'Thẻ Đổi Tên', description: 'Cho phép đổi nickname hiển thị 1 lần', price: 500, category: 'special', value: 'rename_token', icon: '🎫' },
    { id: 'item_event_ticket', name: 'Vé Đại Sự Kiện Tuần', description: 'Vé tham gia thi đấu trực tiếp tối Thứ 7', price: 500, category: 'special', value: 'grand_ticket', icon: '🎟️' }
  ]);

  const [selectedCategory, setSelectedCategory] = useState<'all' | 'avatar' | 'frame' | 'title' | 'special'>('all');
  const [buySuccessMsg, setBuySuccessMsg] = useState<string | null>(null);

  const filteredItems = selectedCategory === 'all'
    ? items
    : items.filter(i => i.category === selectedCategory);

  const handlePurchase = (item: ShopItem) => {
    if (profile.coins < item.price) {
      alert('Bạn không đủ Coins để mua vật phẩm này!');
      return;
    }

    let updated = { ...profile, coins: profile.coins - item.price };

    if (item.category === 'frame' && item.value) {
      updated.avatarFrame = item.value;
    } else if (item.category === 'title' && item.value) {
      updated.equippedTitle = item.name;
      updated.titleColor = item.value;
    } else if (item.category === 'avatar' && item.value) {
      updated.avatar = item.value;
    }

    onUpdateProfile(updated);
    setBuySuccessMsg(`🎉 Bạn đã mua và trang bị thành công "${item.name}"!`);
    setTimeout(() => setBuySuccessMsg(null), 3000);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel rounded-3xl p-6 border border-cyan-500/30">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-black uppercase">
              IN-GAME STORE
            </span>
            <span className="text-xs text-slate-400">Trang Phục, Khung Phát Sáng, Danh Hiệu & Vé Sự Kiện</span>
          </div>
          <h1 className="text-3xl font-black text-white mt-1">
            CỬA HÀNG VẬT PHẨM SAMEQUIZ
          </h1>
        </div>

        <div className="flex items-center gap-2 bg-amber-950/40 border border-amber-500/40 px-5 py-2.5 rounded-2xl">
          <Coins className="w-5 h-5 text-amber-400 animate-pulse" />
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase">Số Dư Hiện Tại</div>
            <div className="text-lg font-black text-amber-300 font-mono">{profile.coins.toLocaleString()} Coins</div>
          </div>
        </div>
      </div>

      {buySuccessMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500 text-emerald-300 text-xs sm:text-sm font-bold flex items-center gap-2 animate-bounce">
          <Sparkles className="w-5 h-5" /> {buySuccessMsg}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {[
          { id: 'all', label: '🌟 Tất Cả Vật Phẩm' },
          { id: 'frame', label: '🖼️ Khung Avatar Phát Sáng' },
          { id: 'title', label: '👑 Khung Tên & Danh Hiệu' },
          { id: 'avatar', label: '👤 Trang Phục / Skins' },
          { id: 'special', label: '🎫 Thẻ Đổi Tên & Vé' }
        ].map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedCategory === cat.id ? 'bg-cyan-500 text-slate-950 font-black shadow-lg shadow-cyan-500/20' : 'bg-slate-900 text-slate-300 border border-slate-800 hover:border-cyan-500/50'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map(item => {
          const isEquipped = profile.avatarFrame === item.value || profile.avatar === item.value || profile.titleColor === item.value;

          return (
            <div
              key={item.id}
              className="glass-panel rounded-3xl p-6 border border-slate-800 hover:border-cyan-500/50 transition-all flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="w-16 h-16 rounded-2xl bg-slate-900 flex items-center justify-center text-3xl mx-auto mb-4 border-2 border-slate-800 shadow-inner">
                  {item.icon}
                </div>
                <div className="text-center">
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-bold uppercase">
                    {item.category}
                  </span>
                  <h3 className="text-base font-black text-white mt-1">{item.name}</h3>
                  <p className="text-xs text-slate-400 mt-1">{item.description}</p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-1 text-amber-300 font-mono font-black text-sm">
                  <Coins className="w-4 h-4" /> {item.price.toLocaleString()}
                </div>

                <button
                  onClick={() => handlePurchase(item)}
                  disabled={isEquipped}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    isEquipped
                      ? 'bg-slate-800 text-emerald-400 border border-emerald-500/40 cursor-default'
                      : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md'
                  }`}
                >
                  {isEquipped ? '✓ ĐANG TRANG BỊ' : 'MUA NGAY'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
