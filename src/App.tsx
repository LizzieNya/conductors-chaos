import { useCallback, useEffect, useState } from 'react';
import { useGameStore } from './store';
import { Stage } from './Stage';
import { MainMenu } from './ui/MainMenu';
import { EndScreen } from './ui/EndScreen';
import { chaosEngine, type Difficulty } from './chaos/engine';
import { audioMixer } from './audio/mixer';
import { MiniGameManager } from './minigames/MiniGameManager';
import type { MiniGameResult } from './minigames/types';
import { useGamificationStore } from './gamification';

function App() {
  const phase = useGameStore((s) => s.phase);
  const activeMiniGame = useGameStore((s) => s.activeMiniGame);
  const [paused, setPaused] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('conductors-chaos-highscore');
    return saved ? parseInt(saved, 10) : 0;
  });
  const updateStreak = useGamificationStore((s) => s.updateStreak);
  const generateDailyChallenge = useGamificationStore((s) => s.generateDailyChallenge);
  const addXP = useGamificationStore((s) => s.addXP);

  useEffect(() => {
    updateStreak();
    generateDailyChallenge();
  }, []);

  const handleMiniGameComplete = useCallback((result: MiniGameResult) => {
    const store = useGameStore.getState();
    store.addScore(result.score + result.bonus);
    store.addMiniGameScore(result.score + result.bonus);
    store.setActiveMiniGame(null);
    addXP(result.success ? 100 : 50);
  }, [addXP]);

  const startConcert = useCallback(async () => {
    setPaused(false);
    chaosEngine.setDifficulty(difficulty);
    await chaosEngine.start();
  }, [difficulty]);

  const handleReplay = useCallback(async () => {
    chaosEngine.stop();
    useGameStore.getState().resetGame();
    setPaused(false);
    setTimeout(() => {
      chaosEngine.start();
    }, 300);
  }, []);

  const handleMenu = useCallback(() => {
    chaosEngine.stop();
    useGameStore.getState().resetGame();
    useGameStore.getState().setPhase('menu');
    setPaused(false);
  }, []);

  // Save high score on results
  useEffect(() => {
    if (phase === 'results') {
      const scoreData = useGameStore.getState().getScoreData();
      if (scoreData.stars >= 3) {
        useGameStore.getState().unlockNextLevel();
      }
      if (scoreData.totalScore > highScore) {
        setHighScore(scoreData.totalScore);
        localStorage.setItem('conductors-chaos-highscore', String(scoreData.totalScore));
      }
      
      // Add XP based on performance
      const xpGained = Math.floor(scoreData.totalScore / 10) + scoreData.stars * 100;
      addXP(xpGained);
      
      // Update stats
      const gamStore = useGamificationStore.getState();
      gamStore.incrementStat('totalPlays');
      gamStore.incrementStat('totalScore', scoreData.totalScore);
      if (scoreData.harmonyPct === 100) {
        gamStore.incrementStat('perfectConcerts');
      }
    }
  }, [phase, highScore, addXP]);

  const handleNextLevel = useCallback(() => {
    const store = useGameStore.getState();
    const nextLevel = Math.min(30, store.currentLevel + 1);
    store.setCurrentLevel(nextLevel);
    handleReplay();
  }, [handleReplay]);

  // Pause with Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && phase === 'playing') {
        setPaused((p) => !p);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase]);

  // Handle tab visibility — pause on tab away
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden && phase === 'playing') {
        setPaused(true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [phase]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      chaosEngine.stop();
      audioMixer.destroy();
    };
  }, []);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        fontFamily: '"Inter", system-ui, -apple-system, sans-serif',
      }}
    >
      {phase === 'menu' && <MainMenu onStart={startConcert} highScore={highScore} difficulty={difficulty} onDifficultyChange={setDifficulty} />}

      {activeMiniGame && (
        <MiniGameManager gameType={activeMiniGame} onComplete={handleMiniGameComplete} />
      )}

      {phase === 'playing' && (
        <>
          <Stage />
          {/* Pause Overlay */}
          {paused && (
            <div
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.8)',
                backdropFilter: 'blur(8px)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 200,
                animation: 'fadeIn 0.2s ease-out',
              }}
            >
              <div
                style={{
                  fontSize: 48,
                  fontWeight: 900,
                  color: '#f8fafc',
                  marginBottom: 8,
                  textShadow: '0 0 20px rgba(139, 92, 246, 0.5)',
                }}
              >
                ⏸️ PAUSED
              </div>
              <div style={{ fontSize: 14, color: '#94a3b8', marginBottom: 32 }}>
                Press <kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: 4, border: '1px solid rgba(255,255,255,0.2)' }}>ESC</kbd> to resume
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  onClick={() => setPaused(false)}
                  style={{
                    padding: '12px 32px',
                    fontSize: 16,
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 12,
                    cursor: 'pointer',
                    transition: 'transform 0.15s',
                    boxShadow: '0 4px 15px rgba(139, 92, 246, 0.4)',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  ▶️ Resume
                </button>
                <button
                  onClick={handleMenu}
                  style={{
                    padding: '12px 32px',
                    fontSize: 16,
                    fontWeight: 700,
                    background: 'rgba(255,255,255,0.1)',
                    color: '#fff',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: 12,
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
                >
                  🏠 Quit to Menu
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {phase === 'results' && (
        <>
          <Stage />
          <EndScreen onReplay={handleReplay} onMenu={handleMenu} difficulty={difficulty} onNextLevel={handleNextLevel} />
        </>
      )}
    </div>
  );
}

export default App;
