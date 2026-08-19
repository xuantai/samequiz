import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HomeView } from './components/HomeView';
import { DuelArena } from './components/DuelArena';
import { SplitScreenArena } from './components/SplitScreenArena';
import { TournamentView } from './components/TournamentView';
import { GrandEventArena } from './components/GrandEventArena';
import { ShopView } from './components/ShopView';
import { LeaderboardView } from './components/LeaderboardView';
import { ProfileView } from './components/ProfileView';
import { MasterAdminView } from './components/admin/MasterAdminView';
import { MatchmakingModal } from './components/MatchmakingModal';
import { PlayerProfile, MatchRules } from './types/game';
import { getProfile, updatePlayerProfile } from './services/storageService';
import { DEFAULT_QUESTIONS } from './data/defaultQuestions';

type ViewMode = 'home' | 'duel' | 'split_screen' | 'tournament' | 'grand_event' | 'shop' | 'leaderboard' | 'profile' | 'master_admin';

export function App() {
  const [profile, setProfile] = useState<PlayerProfile>(getProfile);
  const [currentView, setCurrentView] = useState<ViewMode>(() => {
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/master')) {
      return 'master_admin';
    }
    return 'home';
  });

  const [isSoundMuted, setIsSoundMuted] = useState(false);
  const [isMatchmakingOpen, setIsMatchmakingOpen] = useState(false);
  const [matchmakingMode, setMatchmakingMode] = useState<'random' | 'friend' | 'ai'>('random');

  // Match state
  const [opponent, setOpponent] = useState<PlayerProfile>({
    id: 'opp_bot_1',
    username: 'Quang Thần Đồng',
    avatar: '🧠',
    country: 'VN',
    coins: 4500,
    elo: 1450,
    offlineElo: 1450,
    inventory: [],
    statsOnline: {
      totalQuestions: 150,
      correctQuestions: 120,
      categoryStats: {},
      onlineWins: 32,
      onlineLosses: 10,
      offlineWins: 0,
      offlineLosses: 0,
      highestStreak: 8
    },
    statsOffline: {
      totalQuestions: 0,
      correctQuestions: 0,
      categoryStats: {},
      onlineWins: 0,
      onlineLosses: 0,
      offlineWins: 0,
      offlineLosses: 0,
      highestStreak: 0
    }
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
  };

  const handleOpenMatchmaking = (mode: 'random' | 'friend' | 'ai') => {
    setMatchmakingMode(mode);
    setIsMatchmakingOpen(true);
  };

  const handleStartMatch = (rules: MatchRules, _roomPin?: string, aiLevel?: 'easy' | 'medium' | 'hard') => {
    setIsMatchmakingOpen(false);
    setActiveRules(rules);

    if (matchmakingMode === 'ai') {
      setOpponent({
        id: 'bot_' + Date.now(),
        username: aiLevel === 'hard' ? 'AI Thần Đồng (Hard)' : aiLevel === 'easy' ? 'AI Tập Sự (Easy)' : 'AI Cao Thủ (Medium)',
        avatar: '🤖',
        country: 'VN',
        coins: 1000,
        elo: aiLevel === 'hard' ? 1800 : aiLevel === 'easy' ? 900 : 1350,
        offlineElo: 1200,
        inventory: [],
        statsOnline: { totalQuestions: 0, correctQuestions: 0, categoryStats: {}, onlineWins: 0, onlineLosses: 0, offlineWins: 0, offlineLosses: 0, highestStreak: 0 },
        statsOffline: { totalQuestions: 0, correctQuestions: 0, categoryStats: {}, onlineWins: 0, onlineLosses: 0, offlineWins: 0, offlineLosses: 0, highestStreak: 0 }
      });
    }

    setCurrentView('duel');
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
      {currentView !== 'split_screen' && currentView !== 'duel' && (
        <Navbar
          profile={profile}
          activeTab={currentView}
          setActiveTab={(tab: string) => navigateTo(tab as ViewMode)}
          isMuted={isSoundMuted}
          onToggleMute={() => setIsSoundMuted(!isSoundMuted)}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 w-full">
        {currentView === 'home' && (
          <HomeView
            profile={profile}
            onOpenMatchmaking={handleOpenMatchmaking}
            onOpenSplitScreen={() => setCurrentView('split_screen')}
            onOpenTournament={() => setCurrentView('tournament')}
            onOpenGrandEvent={() => setCurrentView('grand_event')}
            onOpenShop={() => setCurrentView('shop')}
            onOpenLeaderboard={() => setCurrentView('leaderboard')}
            onOpenProfile={() => setCurrentView('profile')}
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
        onStartMatch={handleStartMatch}
      />
    </div>
  );
}

export default App;
