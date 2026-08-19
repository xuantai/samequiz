import React, { useState } from 'react';
import { 
  Plus, Trash2, Check, Coins, Users, Trophy, ShoppingBag, Sparkles 
} from 'lucide-react';
import { Question, ShopItem, GrandEvent, QuestionReport, PlayerProfile } from '../../types/game';
import { CATEGORIES } from '../../data/categories';
import { DEFAULT_QUESTIONS } from '../../data/defaultQuestions';

export const MasterAdminView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'kpi' | 'questions' | 'shop' | 'events' | 'users' | 'reports'>('kpi');

  const [questions, setQuestions] = useState<Question[]>(DEFAULT_QUESTIONS);
  const [shopItems, setShopItems] = useState<ShopItem[]>([
    { id: 'frame_gold', name: 'Khung Vàng Hoàng Kim', description: 'Viền vàng lấp lánh', price: 2000, category: 'frame', value: 'border-yellow-400', icon: '👑' },
    { id: 'frame_cyber', name: 'Khung Cyber Neon', description: 'Hiệu ứng ánh sáng Cyberpunk', price: 3500, category: 'frame', value: 'border-cyan-400', icon: '⚡' },
    { id: 'title_god', name: 'Vua Tri Thức', description: 'Danh hiệu cao quý nhất SameQuiz', price: 8000, category: 'title', value: 'text-fuchsia-400', icon: '🌟' }
  ]);
  const [events, setEvents] = useState<GrandEvent[]>([
    {
      id: 'event_weekly_1',
      title: '🏆 ĐẠI CHIẾN VUA TRI THỨC TOÀN HỆ THỐNG - MÙA 1',
      description: 'Thi chung 1 câu hỏi 100+ người, tốc độ chốt đáp án quyết định điểm số!',
      themeCategoryIds: [],
      scheduledTime: '20:00 Thứ 7',
      ticketPrice: 500,
      prizePool: 50000,
      status: 'live',
      registeredPlayerCount: 124,
      totalRounds: 10
    }
  ]);
  const [reports, setReports] = useState<QuestionReport[]>([
    {
      id: 'rep_1',
      questionId: 'q_2',
      questionText: 'Thành phố nào là kinh đô đầu tiên của nước Đại Việt dưới triều Lý?',
      reporterId: 'usr_1',
      reporterName: 'Quang Thần Đồng',
      reason: 'Cần bổ sung thêm năm dời đô từ Hoa Lư về Thăng Long (1010) vào phần giải thích.',
      timestamp: Date.now() - 3600000,
      status: 'pending',
      bountyRewarded: 500
    }
  ]);

  const defaultStats = { totalQuestions: 0, correctQuestions: 0, categoryStats: {}, onlineWins: 0, onlineLosses: 0, offlineWins: 0, offlineLosses: 0, highestStreak: 0 };

  const [users, setUsers] = useState<PlayerProfile[]>([
    { id: 'usr_admin', username: 'Administrator (Master)', avatar: '⚡', role: 'admin', elo: 2500, offlineElo: 2500, coins: 999999, country: 'VN', isBanned: false, inventory: [], statsOnline: { ...defaultStats, onlineWins: 95 }, statsOffline: defaultStats },
    { id: 'usr_1', username: 'Quang Thần Đồng', avatar: '🧠', role: 'player', elo: 1850, offlineElo: 1850, coins: 5400, country: 'VN', isBanned: false, inventory: [], statsOnline: { ...defaultStats, onlineWins: 40 }, statsOffline: defaultStats },
    { id: 'usr_2', username: 'Hương Bách Khoa', avatar: '🌸', role: 'player', elo: 1690, offlineElo: 1690, coins: 3200, country: 'VN', isBanned: false, inventory: [], statsOnline: { ...defaultStats, onlineWins: 22 }, statsOffline: defaultStats }
  ]);

  // Form State
  const [newQText, setNewQText] = useState('');
  const [newQOptions, setNewQOptions] = useState(['', '', '', '']);
  const [newQCorrect, setNewQCorrect] = useState(0);
  const [newQHint, setNewQHint] = useState('');
  const [newQExp, setNewQExp] = useState('');
  const [newQDifficulty, setNewQDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [newQCategories] = useState<number[]>([1]);

  const handleAddQuestion = () => {
    if (!newQText.trim() || newQOptions.some(o => !o.trim())) {
      alert('Vui lòng nhập đầy đủ câu hỏi và 4 đáp án!');
      return;
    }

    const q: Question = {
      id: 'q_' + Date.now(),
      country: 'VN',
      categoryIds: newQCategories,
      difficulty: newQDifficulty,
      question: newQText.trim(),
      options: [newQOptions[0].trim(), newQOptions[1].trim(), newQOptions[2].trim(), newQOptions[3].trim()],
      correctIndex: newQCorrect,
      hint: newQHint.trim() || 'Hãy suy nghĩ cẩn thận!',
      explanation: newQExp.trim()
    };

    setQuestions([q, ...questions]);
    setNewQText('');
    setNewQOptions(['', '', '', '']);
    setNewQHint('');
    setNewQExp('');
    alert('Đã thêm câu hỏi thành công vào ngân hàng đề!');
  };

  const handleResolveReport = (reportId: string, approve: boolean) => {
    setReports(reports.map(r => {
      if (r.id === reportId) {
        return { ...r, status: approve ? 'approved' : 'rejected' };
      }
      return r;
    }));

    if (approve) {
      alert('✅ Đã duyệt báo cáo! Hệ thống tự động chuyển thưởng 500 Coin cho Thợ Săn Lỗi!');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel rounded-3xl p-6 border border-fuchsia-500/40 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-fuchsia-500/20 text-fuchsia-400 flex items-center justify-center text-2xl border border-fuchsia-500/40">
            👑
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-fuchsia-500/20 text-fuchsia-300 text-[11px] font-black uppercase">
                MASTER PORTAL (ADMIN)
              </span>
              <span className="text-xs text-slate-400">samequiz.com/master</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white mt-0.5">
              TRUNG TÂM ĐIỀU HÀNH HỆ THỐNG
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            { id: 'kpi', label: '📊 Tổng Quan' },
            { id: 'questions', label: '📚 Ngân Hàng Đề' },
            { id: 'shop', label: '🛍️ Shop & Bảng Giá' },
            { id: 'events', label: '🏆 Sự Kiện Tuần' },
            { id: 'users', label: '👥 Thành Viên' },
            { id: 'reports', label: '🚩 Thợ Săn Lỗi' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === tab.id ? 'bg-fuchsia-500 text-slate-950 font-black shadow-lg shadow-fuchsia-500/20' : 'bg-slate-900 text-slate-300 border border-slate-800 hover:border-fuchsia-500/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'kpi' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-2">
              <div className="text-xs font-bold text-slate-400 uppercase">Tổng Thành Viên</div>
              <div className="text-3xl font-black text-white font-mono">{users.length + 128}</div>
              <span className="text-[11px] text-emerald-400 font-bold">+18 hôm nay</span>
            </div>
            <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-2">
              <div className="text-xs font-bold text-slate-400 uppercase">Ngân Hàng Câu Hỏi</div>
              <div className="text-3xl font-black text-cyan-400 font-mono">{questions.length}</div>
              <span className="text-[11px] text-cyan-300 font-bold">15 Lĩnh vực chuẩn</span>
            </div>
            <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-2">
              <div className="text-xs font-bold text-slate-400 uppercase">Báo Cáo Chờ Duyệt</div>
              <div className="text-3xl font-black text-amber-400 font-mono">{reports.filter(r => r.status === 'pending').length}</div>
              <span className="text-[11px] text-amber-300 font-bold">Thợ săn lỗi tri thức</span>
            </div>
            <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-2">
              <div className="text-xs font-bold text-slate-400 uppercase">Vật Phẩm Shop In-game</div>
              <div className="text-3xl font-black text-fuchsia-400 font-mono">{shopItems.length}</div>
              <span className="text-[11px] text-fuchsia-300 font-bold">Đang mở bán</span>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'questions' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="glass-panel rounded-3xl p-6 border border-cyan-500/30 space-y-4">
            <h3 className="text-base font-black text-cyan-300 uppercase flex items-center gap-2">
              <Plus className="w-4 h-4" /> Thêm Câu Hỏi Mới
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Nội dung câu hỏi</label>
              <textarea
                value={newQText}
                onChange={e => setNewQText(e.target.value)}
                placeholder="VD: Cầu thủ nào đạt nhiều Quả Bóng Vàng nhất lịch sử?"
                className="w-full h-20 bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-cyan-400 resize-none"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300">4 Phương Án (Tick chọn đáp án đúng)</label>
              {newQOptions.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="correct_choice"
                    checked={newQCorrect === idx}
                    onChange={() => setNewQCorrect(idx)}
                    className="accent-cyan-400 w-4 h-4 cursor-pointer"
                  />
                  <input
                    type="text"
                    placeholder={`Đáp án ${String.fromCharCode(65 + idx)}`}
                    value={opt}
                    onChange={e => {
                      const updated = [...newQOptions];
                      updated[idx] = e.target.value;
                      setNewQOptions(updated);
                    }}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              ))}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Manh mối gợi ý (Hint)</label>
              <input
                type="text"
                value={newQHint}
                onChange={e => setNewQHint(e.target.value)}
                placeholder="Gợi ý khi người chơi dùng quyền trợ giúp..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Giải thích đáp án</label>
              <input
                type="text"
                value={newQExp}
                onChange={e => setNewQExp(e.target.value)}
                placeholder="Giải thích chi tiết..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            <button
              onClick={handleAddQuestion}
              className="w-full py-3 rounded-xl bg-cyan-500 text-slate-950 font-black text-xs cursor-pointer shadow-lg shadow-cyan-500/20"
            >
              LƯU VÀO NGÂN HÀNG CÂU HỎI
            </button>
          </div>

          <div className="lg:col-span-2 glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
            <h3 className="text-base font-black text-white">Danh Sách Câu Hỏi ({questions.length})</h3>

            <div className="max-h-[600px] overflow-y-auto space-y-3 pr-1">
              {questions.map((q) => (
                <div key={q.id} className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                  <div className="flex justify-between items-start gap-4">
                    <span className="text-xs font-black text-slate-100">{q.question}</span>
                    <button
                      onClick={() => setQuestions(questions.filter(item => item.id !== q.id))}
                      className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    {q.options.map((o, idx) => (
                      <span
                        key={idx}
                        className={`p-1.5 rounded-lg border ${
                          idx === q.correctIndex ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold' : 'bg-slate-950/40 border-slate-850 text-slate-400'
                        }`}
                      >
                        {String.fromCharCode(65 + idx)}. {o}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'shop' && (
        <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-6">
          <h3 className="text-base font-black text-white">Quản Lý Vật Phẩm Cửa Hàng & Định Giá Coins</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {shopItems.map(item => (
              <div key={item.id} className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{item.icon}</span>
                  <div>
                    <div className="text-xs font-black text-slate-100">{item.name}</div>
                    <div className="text-[10px] text-amber-300 font-mono font-bold">{item.price.toLocaleString()} Coins</div>
                  </div>
                </div>
                <button
                  onClick={() => setShopItems(shopItems.filter(i => i.id !== item.id))}
                  className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'events' && (
        <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-6">
          <h3 className="text-base font-black text-white">Quản Lý Lịch Sự Kiện Tuần</h3>
          <div className="space-y-3">
            {events.map(evt => (
              <div key={evt.id} className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-sm font-black text-amber-300">{evt.title}</div>
                  <div className="text-xs text-slate-400">{evt.description}</div>
                  <div className="text-[10px] text-cyan-400 font-mono mt-1">Vé: {evt.ticketPrice} Coins • Thưởng: {evt.prizePool.toLocaleString()} Coins</div>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/40">
                  {evt.status === 'live' ? 'Đang Mở' : 'Sắp Diễn Ra'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-6">
          <h3 className="text-base font-black text-white">Quản Lý Người Dùng & Cấm Tài Khoản</h3>
          <div className="space-y-2">
            {users.map(u => (
              <div key={u.id} className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{u.avatar}</span>
                  <div>
                    <div className="text-xs font-black text-slate-100">{u.username}</div>
                    <div className="text-[10px] text-cyan-400 font-mono">ELO {u.elo} • {u.coins} Coins</div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setUsers(users.map(item => item.id === u.id ? { ...item, isBanned: !item.isBanned } : item));
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                    u.isBanned ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  {u.isBanned ? 'ĐÃ KHÓA (MỞ)' : 'KHÓA TÀI KHOẢN'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="glass-panel rounded-3xl p-6 border border-amber-500/30 space-y-6">
          <div>
            <h3 className="text-base font-black text-amber-300 uppercase flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" /> TRUNG TÂM DUYỆT BÁO CÁO THỢ SĂN LỖI
            </h3>
            <p className="text-xs text-slate-400">Duyệt đúng sẽ tự động chuyển thưởng 500 Coin cho người báo cáo</p>
          </div>

          <div className="space-y-4">
            {reports.map(rep => (
              <div key={rep.id} className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs text-slate-400 font-bold">Người báo cáo: <strong className="text-cyan-400">{rep.reporterName}</strong></span>
                    <h4 className="text-sm font-black text-slate-100 mt-1">{rep.questionText}</h4>
                  </div>
                  <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                    rep.status === 'pending' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : rep.status === 'approved' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                  }`}>
                    {rep.status}
                  </span>
                </div>

                <p className="text-xs text-amber-200 bg-amber-950/30 p-3 rounded-xl border border-amber-500/20 italic">
                  💬 Nội dung phản ánh: "{rep.reason}"
                </p>

                {rep.status === 'pending' && (
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => handleResolveReport(rep.id, true)}
                      className="px-4 py-1.5 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Check className="w-4 h-4" /> DUYỆT VÀ PHÁT THƯỞNG 500 COINS
                    </button>
                    <button
                      onClick={() => handleResolveReport(rep.id, false)}
                      className="px-4 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white font-bold text-xs cursor-pointer"
                    >
                      TỪ CHỐI
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
