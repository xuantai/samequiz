import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HomeView } from './components/HomeView';
import { DuelArena } from './components/DuelArena';
import { PracticeArena } from './components/PracticeArena';
import { SplitScreenArena } from './components/SplitScreenArena';
import { TournamentView } from './components/TournamentView';
import { GrandEventArena } from './components/GrandEventArena';
import { ShopView } from './components/ShopView';
import { LeaderboardView } from './components/LeaderboardView';
import { ProfileView } from './components/ProfileView';
import { MasterAdminView } from './components/admin/MasterAdminView';
import { MatchmakingModal } from './components/MatchmakingModal';
import { AuthModal } from './components/AuthModal';
import { PlayerProfile, MatchRules } from './types/game';
import { getProfile, updatePlayerProfile } from './services/storageService';
import { authService, getAuthToken } from './services/authService';
import { DEFAULT_QUESTIONS } from './data/defaultQuestions';

type ViewMode = 'home' | 'practice' | 'duel' | 'split_screen' | 'tournament' | 'grand_event' | 'shop' | 'leaderboard' | 'profile' | 'master_admin';

export function App() {
  const [profile, setProfile] = useState<PlayerProfile>(getProfile);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => !!getAuthToken());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [currentView, setCurrentView] = useState<ViewMode>(() => {
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/master')) {
      return 'master_admin';
    }
    return 'home';
  });

  // Check and restore logged in user from Postgres
  useEffect(() => {
    if (getAuthToken()) {
      authService.fetchCurrentUser().then(user => {
        if (user) {
          setProfile(user);
          setIsLoggedIn(true);
        }
      });
    }
  }, []);

  const [isSoundMuted, setIsSoundMuted] = useState(false);
  const [isMatchmakingOpen, setIsMatchmakingOpen] = useState(false);
  const [matchmakingMode, setMatchmakingMode] = useState<'random' | 'friend' | 'ai'>('random');

  // Match state (Mặc định AI Bot Luyện Tập - Không giả mạo người thật)
  const [opponent, setOpponent] = useState<PlayerProfile>({
    id: 'bot_ai_training',
    username: 'AI Bot Luyện Tập',
    avatar: '🤖',
    country: 'VN',
    coins: 1000,
    elo: 1200,
    offlineElo: 1200,
    inventory: [],
    statsOnline: { totalQuestions: 0, correctQuestions: 0, categoryStats: {}, onlineWins: 0, onlineLosses: 0, offlineWins: 0, offlineLosses: 0, highestStreak: 0 },
    statsOffline: { totalQuestions: 0, correctQuestions: 0, categoryStats: {}, onlineWins: 0, onlineLosses: 0, offlineWins: 0, offlineLosses: 0, highestStreak: 0 }
  });

  const [activeRules, setActiveRules] = useState<MatchRules>({
    difficulty: 'random',
    categoryIds: [],
    isHomeAway: false,
    lifelines: { fiftyFifty: true, hint: true, removeOne: true, reduceOpponentTime: true, addSelfTime: true },
    totalQuestions: 10,
    timePerQuestion: 30
  });

  // Sync URL changes
  useEffect(() => {
    const handlePopState = () => {
      if (window.location.pathname.startsWith('/master')) {
        setCurrentView('master_admin');
      } else {
        setCurrentView('home');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (view: ViewMode) => {
    setCurrentView(view);
    if (view === 'master_admin') {
      window.history.pushState({}, '', '/master');
    } else {
      window.history.pushState({}, '', '/');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdateProfile = (updated: PlayerProfile) => {
    const saved = updatePlayerProfile(updated);
    setProfile(saved);
    // Sync to Supabase PostgreSQL
    authService.syncProfile(saved);
  };

  const handleOpenMatchmaking = (mode: 'random' | 'friend' | 'ai') => {
    setMatchmakingMode(mode);
    setIsMatchmakingOpen(true);
  };

  const handleStartMatch = (rules: MatchRules, _roomPin?: string, aiLevel?: 'easy' | 'medium' | 'hard', matchedOpponent?: PlayerProfile) => {
    setIsMatchmakingOpen(false);
    setActiveRules(rules);

    if (matchedOpponent) {
      setOpponent(matchedOpponent);
    } else if (matchmakingMode === 'ai' || aiLevel) {
      setOpponent({
        id: 'bot_ai_' + Date.now(),
        username: aiLevel === 'hard' ? 'AI Bot Thần Đồng (Hard)' : aiLevel === 'easy' ? 'AI Bot Tập Sự (Easy)' : 'AI Bot Cao Thủ (Medium)',
        avatar: '🤖',
        country: 'VN',
        coins: 1000,
        elo: aiLevel === 'hard' ? 1800 : aiLevel === 'easy' ? 900 : 1350,
        offlineElo: 1200,
        inventory: [],
        statsOnline: { totalQuestions: 0, correctQuestions: 0, categoryStats: {}, onlineWins: 0, onlineLosses: 0, offlineWins: 0, offlineLosses: 0, highestStreak: 0 },
        statsOffline: { totalQuestions: 0, correctQuestions: 0, categoryStats: {}, onlineWins: 0, onlineLosses: 0, offlineWins: 0, offlineLosses: 0, highestStreak: 0 }
      });
    } else {
      setOpponent({
        id: 'bot_ai_training',
        username: 'AI Bot Luyện Tập',
        avatar: '🤖',
        country: 'VN',
        coins: 1000,
        elo: 1200,
        offlineElo: 1200,
        inventory: [],
        statsOnline: { totalQuestions: 0, correctQuestions: 0, categoryStats: {}, onlineWins: 0, onlineLosses: 0, offlineWins: 0, offlineLosses: 0, highestStreak: 0 },
        statsOffline: { totalQuestions: 0, correctQuestions: 0, categoryStats: {}, onlineWins: 0, onlineLosses: 0, offlineWins: 0, offlineLosses: 0, highestStreak: 0 }
      });
    }

    setCurrentView('duel');
  };

  const handleLogout = () => {
    authService.logout();
    setIsLoggedIn(false);
    setProfile(getProfile());
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Dynamic Ambient Background Glows */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute -top-40 left-1/4 w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-[140px] animate-pulse" />
        <div className="absolute top-1/3 -right-40 w-[600px] h-[600px] bg-fuchsia-600/10 rounded-full blur-[140px]" />
        <div className="absolute -bottom-40 left-1/3 w-[600px] h-[600px] bg-amber-600/10 rounded-full blur-[140px]" />
      </div>

      {/* Main Navbar */}
      {currentView !== 'split_screen' && currentView !== 'duel' && currentView !== 'practice' && (
        <Navbar
          profile={profile}
          activeTab={currentView}
          setActiveTab={(tab: string) => navigateTo(tab as ViewMode)}
          isMuted={isSoundMuted}
          onToggleMute={() => setIsSoundMuted(!isSoundMuted)}
          isLoggedIn={isLoggedIn}
          onOpenAuth={() => setIsAuthModalOpen(true)}
          onLogout={handleLogout}
        />
      )}

      {/* Guest Notice Banner */}
      {!isLoggedIn && currentView !== 'split_screen' && currentView !== 'duel' && currentView !== 'practice' && currentView !== 'master_admin' && (
        <div className="bg-gradient-to-r from-cyan-950/90 via-slate-900/95 to-fuchsia-950/90 border-b border-cyan-500/30 px-4 py-2.5 text-center text-xs flex items-center justify-center gap-2 shadow-inner">
          <span className="text-cyan-300 font-bold">⚡ Bạn đang ở chế độ Khách.</span>
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-slate-950 font-black text-[11px] hover:scale-105 transition-transform cursor-pointer shadow-md shadow-cyan-500/20"
          >
            Đăng Ký / Đăng Nhập Ngay
          </button>
          <span className="text-slate-400 hidden sm:inline">để bảo toàn Rank ELO, Coins và sở hữu Skins vĩnh viễn trên Supabase!</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 w-full">
        {currentView === 'home' && (
          <HomeView
            profile={profile}
            onOpenMatchmaking={handleOpenMatchmaking}
            onOpenPractice={() => setCurrentView('practice')}
            onOpenSplitScreen={() => setCurrentView('split_screen')}
            onOpenTournament={() => setCurrentView('tournament')}
            onOpenGrandEvent={() => setCurrentView('grand_event')}
            onOpenShop={() => setCurrentView('shop')}
            onOpenLeaderboard={() => setCurrentView('leaderboard')}
            onOpenProfile={() => setCurrentView('profile')}
          />
        )}

        {currentView === 'practice' && (
          <PracticeArena
            profile={profile}
            onUpdateProfile={handleUpdateProfile}
            onExit={() => navigateTo('home')}
          />
        )}

        {currentView === 'duel' && (
          <DuelArena
            myProfile={profile}
            opponentProfile={opponent}
            questions={DEFAULT_QUESTIONS}
            rules={activeRules}
            isOnline={matchmakingMode !== 'ai'}
            onExit={() => navigateTo('home')}
          />
        )}

        {currentView === 'split_screen' && (
          <SplitScreenArena
            onExit={() => navigateTo('home')}
          />
        )}

        {currentView === 'tournament' && (
          <TournamentView
            profile={profile}
            onStartTournamentMatch={(p1, p2, rules) => {
              setOpponent(p2.id === profile.id ? p1 : p2);
              setActiveRules(rules);
              setCurrentView('duel');
            }}
            onSpectateMatch={(_p1, p2) => {
              setOpponent(p2);
              setCurrentView('duel');
            }}
          />
        )}

        {currentView === 'grand_event' && (
          <GrandEventArena
            profile={profile}
            onExit={() => navigateTo('home')}
            onUpdateProfile={handleUpdateProfile}
          />
        )}

        {currentView === 'shop' && (
          <ShopView
            profile={profile}
            onUpdateProfile={handleUpdateProfile}
          />
        )}

        {currentView === 'leaderboard' && (
          <LeaderboardView
            profile={profile}
          />
        )}

        {currentView === 'profile' && (
          <ProfileView
            profile={profile}
            onUpdateProfile={handleUpdateProfile}
          />
        )}

        {currentView === 'master_admin' && (
          <MasterAdminView />
        )}
      </main>

      {/* Matchmaking Modal */}
      <MatchmakingModal
        isOpen={isMatchmakingOpen}
        onClose={() => setIsMatchmakingOpen(false)}
        mode={matchmakingMode}
        profile={profile}
        onStartMatch={handleStartMatch}
      />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={(userProfile) => {
          setProfile(userProfile);
          setIsLoggedIn(true);
          setIsAuthModalOpen(false);
        }}
      />
    </div>
  );
}

export default App;
