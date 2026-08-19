import React, { useState } from 'react';
import { X, Lock, User, Sparkles, LogIn, UserPlus, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { PlayerProfile } from '../types/game';
import { authService } from '../services/authService';
import { soundEngine } from '../services/soundEngine';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (profile: PlayerProfile) => void;
}

const AVATAR_OPTIONS = ['🧠', '⚡', '🌸', '🦁', '👑', '🚀', '🥋', '🐉', '🦊', '🤖', '🎯', '🔥'];

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('🧠');
  const [country, setCountry] = useState('VN');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!username.trim()) {
      setErrorMsg('Vui lòng nhập tên đăng nhập.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }

    if (tab === 'register' && password !== confirmPassword) {
      setErrorMsg('Mật khẩu xác nhận không khớp.');
      return;
    }

    setLoading(true);
    soundEngine.playSelect();

    try {
      if (tab === 'login') {
        const res = await authService.login({ username, password });
        if (res.success && res.user) {
          soundEngine.playVictory();
          setSuccessMsg('Đăng nhập thành công!');
          setTimeout(() => {
            onLoginSuccess(res.user!);
            onClose();
          }, 800);
        } else {
          soundEngine.playWrong();
          setErrorMsg(res.error || 'Đăng nhập không thành công.');
        }
      } else {
        const res = await authService.register({
          username,
          password,
          avatar: selectedAvatar,
          country
        });
        if (res.success && res.user) {
          soundEngine.playVictory();
          setSuccessMsg('Đăng ký tài khoản thành công!');
          setTimeout(() => {
            onLoginSuccess(res.user!);
            onClose();
          }, 800);
        } else {
          soundEngine.playWrong();
          setErrorMsg(res.error || 'Đăng ký không thành công.');
        }
      }
    } catch (err: any) {
      soundEngine.playWrong();
      setErrorMsg('Lỗi kết nối máy chủ. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md glass-panel rounded-3xl p-6 sm:p-8 border border-cyan-500/40 relative shadow-2xl overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-fuchsia-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Title */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto text-2xl mb-3 text-cyan-400 shadow-lg shadow-cyan-500/10">
            {tab === 'login' ? <LogIn className="w-7 h-7" /> : <UserPlus className="w-7 h-7" />}
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            {tab === 'login' ? 'ĐĂNG NHẬP SAMEQUIZ' : 'TẠO TÀI KHOẢN MỚI'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Lưu trữ ELO, Coins, bảng xếp hạng và kho đồ vĩnh viễn trên đám mây PostgreSQL.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-900 border border-slate-800 mb-6">
          <button
            type="button"
            onClick={() => {
              setTab('login');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              tab === 'login'
                ? 'bg-cyan-500 text-slate-950 font-black shadow-lg shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ĐĂNG NHẬP
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('register');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              tab === 'register'
                ? 'bg-fuchsia-600 text-white font-black shadow-lg shadow-fuchsia-600/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ĐĂNG KÝ
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {tab === 'register' && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase">Chọn Avatar Đại Diện:</label>
              <div className="grid grid-cols-6 gap-2 p-2 rounded-2xl bg-slate-900 border border-slate-800">
                {AVATAR_OPTIONS.map(av => (
                  <button
                    key={av}
                    type="button"
                    onClick={() => setSelectedAvatar(av)}
                    className={`h-10 rounded-xl text-lg flex items-center justify-center transition-all cursor-pointer ${
                      selectedAvatar === av
                        ? 'bg-cyan-500/20 border-2 border-cyan-400 scale-110 shadow-lg shadow-cyan-500/30'
                        : 'bg-slate-950/60 border border-slate-800 hover:border-slate-600'
                    }`}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Username */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 uppercase">Tên Đăng Nhập:</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="vd: quang_master"
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-white text-sm focus:border-cyan-400 focus:outline-none transition-colors"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 uppercase">Mật Khẩu:</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Ít nhất 6 ký tự"
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-white text-sm focus:border-cyan-400 focus:outline-none transition-colors"
                required
              />
            </div>
          </div>

          {/* Confirm Password (Register only) */}
          {tab === 'register' && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase">Nhập Lại Mật Khẩu:</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Xác nhận mật khẩu"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-white text-sm focus:border-cyan-400 focus:outline-none transition-colors"
                  required
                />
              </div>
            </div>
          )}

          {/* Error & Success Alerts */}
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3.5 rounded-2xl font-black text-sm text-slate-950 transition-all flex items-center justify-center gap-2 shadow-xl cursor-pointer ${
              tab === 'login'
                ? 'bg-cyan-500 hover:bg-cyan-400 shadow-cyan-500/20'
                : 'bg-gradient-to-r from-fuchsia-500 to-cyan-500 hover:from-fuchsia-400 hover:to-cyan-400 text-white shadow-fuchsia-500/20'
            } ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:scale-[1.02]'}`}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang xử lý...
              </>
            ) : tab === 'login' ? (
              <>
                <LogIn className="w-4 h-4" /> ĐĂNG NHẬP NGAY
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" /> TẠO TÀI KHOẢN & NHẬN 1,200 COINS
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
