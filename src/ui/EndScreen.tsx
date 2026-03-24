import React, { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../store';
import { useUpgradeStore } from '../upgrades';
import { useAchievementStore } from '../achievements';
import { useLeaderboardStore } from '../leaderboard';
import type { Difficulty } from '../chaos/engine';
import { Leaderboard } from './Leaderboard';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  rotation: number;
  rotationSpeed: number;
  life: number;
}

const StatBox: React.FC<{ label: string; value: string; color: string }> = ({ label, value, color }) => (
  <div
    style={{
      background: 'rgba(0,0,0,0.3)',
      borderRadius: 12,
      padding: '12px 16px',
      border: `1px solid ${color}33`,
      transition: 'transform 0.15s',
    }}
    onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
    onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
  >
    <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4, letterSpacing: 1, fontWeight: 700 }}>{label.toUpperCase()}</div>
    <div style={{ fontSize: 22, fontWeight: 800, color, textShadow: `0 0 8px ${color}44` }}>{value}</div>
  </div>
);

export const EndScreen: React.FC<{ onReplay: () => void; onMenu: () => void; difficulty: Difficulty; onNextLevel?: () => void; }> = ({
  onReplay,
  onMenu,
  difficulty,
  onNextLevel,
}) => {
  const scoreData = useGameStore.getState().getScoreData();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [animatedScore, setAnimatedScore] = useState(0);
  const [coinsEarned, setCoinsEarned] = useState(0);
  const [animatedCoins, setAnimatedCoins] = useState(0);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const hasUpgrade = useUpgradeStore((s) => s.hasUpgrade);
  const addCoins = useUpgradeStore((s) => s.addCoins);
  const addScoreToLeaderboard = useLeaderboardStore((s) => s.addScore);
  
  const [isNewHighScore] = useState(() => {
    const saved = localStorage.getItem('conductors-chaos-highscore');
    const prev = saved ? parseInt(saved, 10) : 0;
    return scoreData.totalScore > prev;
  });

  // Calculate coins earned
  useEffect(() => {
    let baseCoins = Math.floor(scoreData.totalScore / 10);
    
    // Bonus for stars
    baseCoins += scoreData.stars * 50;
    
    // Encore bonus upgrade
    if (scoreData.stars >= 4 && hasUpgrade('encore_bonus')) {
      baseCoins = Math.floor(baseCoins * 1.5);
    }
    
    // Difficulty multiplier
    if (difficulty === 'hard') baseCoins = Math.floor(baseCoins * 1.5);
    if (difficulty === 'easy') baseCoins = Math.floor(baseCoins * 0.75);
    
    setCoinsEarned(baseCoins);
    addCoins(baseCoins);
    
    // Add to leaderboard
    addScoreToLeaderboard('You', scoreData.totalScore, scoreData.stars, useGameStore.getState().currentLevel);
    
    // Check achievements
    const achStore = useAchievementStore.getState();
    
    if (scoreData.stars === 5) {
      achStore.checkAchievement('five_star', 1);
    }
    
    if (scoreData.harmonyPct === 100) {
      achStore.checkAchievement('perfect_harmony', 1);
    }
    
    if (scoreData.chaosMissed === 0) {
      achStore.checkAchievement('no_spread', 1);
    }
    
    achStore.incrementAchievement('millionaire', scoreData.totalScore);
    
    if (difficulty === 'hard') {
      achStore.incrementAchievement('hard_mode_master');
    }
  }, [scoreData, difficulty, hasUpgrade, addCoins, addScoreToLeaderboard]);

  // Animate score counting up
  useEffect(() => {
    let current = 0;
    const target = scoreData.totalScore;
    const step = Math.max(1, Math.floor(target / 60));
    const timer = setInterval(() => {
      current = Math.min(current + step, target);
      setAnimatedScore(current);
      if (current >= target) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [scoreData.totalScore]);

  // Animate coins counting up
  useEffect(() => {
    let current = 0;
    const target = coinsEarned;
    const step = Math.max(1, Math.floor(target / 40));
    const timer = setInterval(() => {
      current = Math.min(current + step, target);
      setAnimatedCoins(current);
      if (current >= target) clearInterval(timer);
    }, 20);
    return () => clearInterval(timer);
  }, [coinsEarned]);

  // Show details after score finishes counting
  useEffect(() => {
    const timer = setTimeout(() => setShowDetails(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  // Confetti!
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const confettiColors = [
      '#ef4444', '#f59e0b', '#22c55e', '#3b82f6',
      '#8b5cf6', '#ec4899', '#14b8a6', '#f97316',
    ];

    const particles: Particle[] = [];

    // Initial burst
    for (let i = 0; i < (scoreData.stars >= 4 ? 250 : 120); i++) {
      particles.push({
        x: canvas.width / 2 + (Math.random() - 0.5) * 300,
        y: canvas.height / 3,
        vx: (Math.random() - 0.5) * 12,
        vy: -Math.random() * 10 - 3,
        color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
        size: Math.random() * 8 + 3,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.2,
        life: 1,
      });
    }

    let frameId: number;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.15; // gravity
        p.rotation += p.rotationSpeed;
        p.life -= 0.005;
        p.vx *= 0.99;

        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      }

      if (particles.length > 0) {
        frameId = requestAnimationFrame(render);
      }
    };

    frameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(frameId);
  }, [scoreData.stars]);

  const starDisplay = '★'.repeat(scoreData.stars) + '☆'.repeat(5 - scoreData.stars);

  const messages = [
    '', // 0 stars
    'The orchestra files a complaint. 📝',
    'The audience survived... barely. 😅',
    'A respectable performance! 🎶',
    'Bravo, Maestro! Standing ovation! 🎉',
    'LEGENDARY! The orchestra weeps with joy! 🏆',
  ];

  const handleShare = async () => {
    const grade = scoreData.stars >= 5 ? 'S' : scoreData.stars >= 4 ? 'A' : scoreData.stars >= 3 ? 'B' : scoreData.stars >= 2 ? 'C' : 'D';
    const shareText = [
      `🎼 Conductor's Chaos`,
      `${starDisplay} [Grade ${grade}]`,
      `🎮 Difficulty: ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}`,
      `🎯 Score: ${Math.round(scoreData.totalScore).toLocaleString()}`,
      `🎵 Harmony: ${scoreData.harmonyPct}%`,
      `🔥 Max Combo: x${scoreData.maxCombo}`,
      `✅ Fixed: ${scoreData.chaosFixed} | ❌ Missed: ${scoreData.chaosMissed}`,
      ``,
      `Can you beat my score?`,
    ].join('\n');
    try {
      await navigator.clipboard.writeText(shareText);
      alert('Score copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(12px)',
        zIndex: 100,
        animation: 'fadeIn 0.5s ease-out',
      }}
    >
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          background: 'linear-gradient(135deg, #1e1b4b, #312e81)',
          borderRadius: 24,
          padding: '48px 56px',
          textAlign: 'center',
          boxShadow: '0 0 60px rgba(139, 92, 246, 0.4), 0 25px 50px rgba(0,0,0,0.5)',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          maxWidth: 460,
          width: '90%',
          position: 'relative',
          animation: 'slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <h2
          style={{
            fontSize: 28,
            fontWeight: 800,
            margin: '0 0 4px',
            background: 'linear-gradient(135deg, #c084fc, #f472b6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Concert Complete!
        </h2>

        {/* NEW HIGH SCORE banner */}
        {isNewHighScore && (
          <div
            style={{
              margin: '8px 0',
              padding: '6px 20px',
              background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2), rgba(245, 158, 11, 0.2))',
              border: '1px solid rgba(251, 191, 36, 0.5)',
              borderRadius: 20,
              fontSize: 14,
              fontWeight: 900,
              color: '#fbbf24',
              display: 'inline-block',
              animation: 'pulse 1s infinite, glow 2s infinite',
              letterSpacing: 2,
              textShadow: '0 0 10px rgba(251, 191, 36, 0.5)',
            }}
          >
            🏆 NEW HIGH SCORE! 🏆
          </div>
        )}

        <div
          style={{
            fontSize: 40,
            letterSpacing: 4,
            margin: '12px 0',
            color: '#fbbf24',
            textShadow: '0 0 20px rgba(251, 191, 36, 0.5)',
          }}
        >
          {starDisplay}
        </div>

        {/* Difficulty badge */}
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: difficulty === 'hard' ? '#ef4444' : difficulty === 'easy' ? '#22c55e' : '#a78bfa',
            marginBottom: 4,
            letterSpacing: 1,
          }}
        >
          {difficulty === 'easy' ? '🌸' : difficulty === 'hard' ? '🔥' : '🎭'} {difficulty.toUpperCase()}
        </div>

        <div
          style={{
            fontSize: 48,
            fontWeight: 900,
            color: '#f8fafc',
            marginBottom: 8,
            textShadow: '0 0 15px rgba(255, 255, 255, 0.4)',
          }}
        >
          {animatedScore.toLocaleString()}
        </div>

        <div
          style={{
            fontSize: 14,
            color: '#a78bfa',
            marginBottom: 24,
            fontStyle: 'italic',
            minHeight: 20,
          }}
        >
          {messages[scoreData.stars]}
        </div>

        {/* Coins Earned */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: 'rgba(251, 191, 36, 0.15)',
            border: '1px solid rgba(251, 191, 36, 0.3)',
            borderRadius: 16,
            padding: '8px 24px',
            fontSize: 18,
            fontWeight: 900,
            color: '#fbbf24',
            marginBottom: 24,
            animation: 'pulse 2s infinite',
          }}
        >
          <span>💰</span>
          <span>+{animatedCoins.toLocaleString()} Coins</span>
        </div>

        {showDetails && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 12,
              marginBottom: 32,
              animation: 'fadeIn 0.4s ease-out',
            }}
          >
            <StatBox label="Harmony" value={`${scoreData.harmonyPct}%`} color="#22c55e" />
            <StatBox label="Max Combo" value={`x${scoreData.maxCombo}`} color="#8b5cf6" />
            <StatBox label="Chaos Fixed" value={String(scoreData.chaosFixed)} color="#3b82f6" />
            <StatBox label="Chaos Missed" value={String(scoreData.chaosMissed)} color="#ef4444" />
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          {scoreData.stars >= 3 && onNextLevel && (
            <button
              onClick={onNextLevel}
              style={{
                padding: '12px 32px',
                fontSize: 16,
                fontWeight: 700,
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: '#fff',
                border: 'none',
                borderRadius: 12,
                cursor: 'pointer',
                transition: 'transform 0.15s, box-shadow 0.15s',
                boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 6px 25px rgba(16, 185, 129, 0.6)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(16, 185, 129, 0.4)';
              }}
            >
              ▶️ Next Level
            </button>
          )}

          <button
            onClick={onReplay}
            style={{
              padding: '12px 32px',
              fontSize: 16,
              fontWeight: 700,
              background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              cursor: 'pointer',
              transition: 'transform 0.15s, box-shadow 0.15s',
              boxShadow: '0 4px 15px rgba(139, 92, 246, 0.4)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = '0 6px 25px rgba(139, 92, 246, 0.6)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(139, 92, 246, 0.4)';
            }}
          >
            🔄 Replay
          </button>
          <button
            onClick={onMenu}
            style={{
              padding: '12px 32px',
              fontSize: 16,
              fontWeight: 700,
              background: 'rgba(255,255,255,0.1)',
              color: '#e2e8f0',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 12,
              cursor: 'pointer',
              transition: 'transform 0.15s, background 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
            }}
          >
            🏠 Menu
          </button>

          <button
            onClick={() => setShowLeaderboard(true)}
            style={{
              padding: '12px 24px',
              fontSize: 16,
              fontWeight: 700,
              background: 'rgba(251, 191, 36, 0.2)',
              color: '#fbbf24',
              border: '1px solid rgba(251, 191, 36, 0.5)',
              borderRadius: 12,
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 4px 15px rgba(251, 191, 36, 0.2)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.background = 'rgba(251, 191, 36, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.background = 'rgba(251, 191, 36, 0.2)';
            }}
          >
            🏆 Leaderboard
          </button>

          <button
            onClick={handleShare}
            style={{
              padding: '12px 24px',
              fontSize: 16,
              fontWeight: 700,
              background: 'rgba(16, 185, 129, 0.2)',
              color: '#10b981',
              border: '1px solid rgba(16, 185, 129, 0.5)',
              borderRadius: 12,
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 4px 15px rgba(16, 185, 129, 0.2)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.background = 'rgba(16, 185, 129, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.background = 'rgba(16, 185, 129, 0.2)';
            }}
          >
            📤 Share
          </button>
        </div>
      </div>
    </div>
  );

  {/* Leaderboard Modal */}
  {showLeaderboard && (
    <Leaderboard onClose={() => setShowLeaderboard(false)} />
  )}
};
