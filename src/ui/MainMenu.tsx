import React, { useEffect, useRef, useState } from 'react';
import type { Difficulty } from '../chaos/engine';
import { LEVELS } from '../chaos/levels';
import { useGameStore } from '../store';
import { useUpgradeStore } from '../upgrades';
import { UpgradeShop } from './UpgradeShop';
import { Settings } from './Settings';
import { GamificationHUD } from './GamificationHUD';

interface FloatingNote {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  note: string;
  rotation: number;
}

export const MainMenu: React.FC<{
  onStart: () => void;
  highScore?: number;
  difficulty: Difficulty;
  onDifficultyChange: (d: Difficulty) => void;
}> = ({ onStart, highScore, difficulty, onDifficultyChange }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hovered, setHovered] = useState(false);
  const [showUpgradeShop, setShowUpgradeShop] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const currentLevel = useGameStore((s) => s.currentLevel);
  const maxUnlockedLevel = useGameStore((s) => s.maxUnlockedLevel);
  const setCurrentLevel = useGameStore((s) => s.setCurrentLevel);
  const coins = useUpgradeStore((s) => s.coins);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const notes: FloatingNote[] = [];
    const noteChars = ['♪', '♫', '♬', '♩', '🎵', '🎶'];

    // Spawn floating notes
    for (let i = 0; i < 30; i++) {
      notes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.8,
        vy: -Math.random() * 0.5 - 0.2,
        size: Math.random() * 16 + 12,
        opacity: Math.random() * 0.4 + 0.1,
        note: noteChars[Math.floor(Math.random() * noteChars.length)],
        rotation: Math.random() * Math.PI * 2,
      });
    }

    let frameId: number;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Background gradient
      const grad = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2, canvas.width
      );
      grad.addColorStop(0, '#1e1b4b');
      grad.addColorStop(0.5, '#0f172a');
      grad.addColorStop(1, '#020617');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Floating music notes with parallax effect
      for (const n of notes) {
        // Larger notes move faster (parallax depth)
        const depthSpeed = n.size / 15;
        n.x += n.vx * depthSpeed;
        n.y += n.vy * depthSpeed;
        n.rotation += 0.01 * depthSpeed;

        // Wrap around
        if (n.y < -30) n.y = canvas.height + 30;
        if (n.x < -30) n.x = canvas.width + 30;
        if (n.x > canvas.width + 30) n.x = -30;

        ctx.save();
        ctx.translate(n.x, n.y);
        ctx.rotate(n.rotation);
        
        // Depth-based blur/opacity
        ctx.globalAlpha = n.opacity;
        if (n.size < 16) {
           ctx.filter = 'blur(1px)';
           ctx.globalAlpha = n.opacity * 0.5;
        }

        ctx.font = `${n.size}px sans-serif`;
        ctx.textAlign = 'center';
        // Add subtle glow
        ctx.shadowColor = 'rgba(255,255,255,0.3)';
        ctx.shadowBlur = 10;
        ctx.fillText(n.note, 0, 0);
        ctx.restore();
      }

      frameId = requestAnimationFrame(render);
    };

    frameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(frameId);
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: 800, margin: '0 auto' }}>
      <GamificationHUD />
      <canvas
        ref={canvasRef}
        width={800}
        height={520}
        style={{
          width: '100%',
          borderRadius: 12,
          display: 'block',
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Title */}
        <h1
          style={{
            fontSize: 56,
            fontWeight: 900,
            margin: 0,
            letterSpacing: -1,
            filter: 'drop-shadow(0 0 15px rgba(244, 114, 182, 0.4))',
            animation: 'pulse 3s infinite alternate',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            justifyContent: 'center',
          }}
        >
          <span>🎼</span>
          <span style={{
            background: 'linear-gradient(135deg, #c084fc, #f472b6, #fb923c)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Conductor's Chaos
          </span>
        </h1>

        <p
          style={{
            fontSize: 18,
            color: '#94a3b8',
            margin: '8px 0 0',
            fontStyle: 'italic',
          }}
        >
          Wave your baton. Save the concert. Try not to laugh.
        </p>

        {highScore != null && highScore > 0 && (
          <div
            style={{
              marginTop: 12,
              padding: '6px 18px',
              background: 'rgba(251, 191, 36, 0.15)',
              border: '1px solid rgba(251, 191, 36, 0.3)',
              borderRadius: 20,
              fontSize: 13,
              fontWeight: 700,
              color: '#fbbf24',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            🏆 High Score: {highScore.toLocaleString()}
          </div>
        )}

        {/* Coins Display */}
        <div
          style={{
            marginTop: 8,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: 'rgba(251, 191, 36, 0.15)',
            border: '1px solid rgba(251, 191, 36, 0.3)',
            borderRadius: 20,
            padding: '6px 18px',
            fontSize: 16,
            fontWeight: 900,
            color: '#fbbf24',
          }}
        >
          <span>💰</span>
          <span>{coins.toLocaleString()} Coins</span>
        </div>

        <div
          style={{
            marginTop: 32,
            width: '100%',
            maxWidth: 600,
            maxHeight: 200,
            overflowY: 'auto',
            background: 'rgba(0,0,0,0.3)',
            borderRadius: 16,
            padding: 16,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))',
            gap: 8,
            boxShadow: 'inset 0 4px 20px rgba(0,0,0,0.5)',
            border: '1px solid rgba(255,255,255,0.05)',
          }}
        >
          {LEVELS.map((level) => {
            const isUnlocked = level.id <= maxUnlockedLevel;
            const isSelected = level.id === currentLevel;
            return (
              <button
                key={level.id}
                disabled={!isUnlocked}
                onClick={() => setCurrentLevel(level.id)}
                style={{
                  aspectRatio: '1',
                  borderRadius: 8,
                  border: isSelected ? '2px solid #8b5cf6' : '1px solid rgba(255,255,255,0.1)',
                  background: isUnlocked
                    ? isSelected
                      ? 'rgba(139, 92, 246, 0.3)'
                      : 'rgba(255,255,255,0.05)'
                    : 'rgba(0,0,0,0.5)',
                  color: isUnlocked ? '#fff' : '#475569',
                  fontSize: 18,
                  fontWeight: 700,
                  cursor: isUnlocked ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s',
                  transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                }}
              >
                {level.id}
              </button>
            );
          })}
        </div>
        
        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 'bold', color: '#e2e8f0', marginBottom: 4 }}>
            {LEVELS[currentLevel - 1]?.title}
          </div>
          <div style={{ fontSize: 14, color: '#94a3b8', fontStyle: 'italic', marginBottom: 16 }}>
            {LEVELS[currentLevel - 1]?.description}
          </div>
        </div>

        <button
          onClick={onStart}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{
            padding: '16px 48px',
            fontSize: 22,
            fontWeight: 800,
            background: hovered
              ? 'linear-gradient(135deg, #9333ea, #6366f1)'
              : 'linear-gradient(135deg, #7e22ce, #4f46e5)',
            color: '#fff',
            border: '2px solid rgba(255,255,255,0.1)',
            borderRadius: 20,
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)', // bouncy transition
            transform: hovered ? 'scale(1.08) translateY(-4px)' : 'scale(1) translateY(0)',
            boxShadow: hovered
              ? '0 15px 35px rgba(139, 92, 246, 0.5), 0 0 20px rgba(255, 255, 255, 0.4) inset'
              : '0 8px 20px rgba(139, 92, 246, 0.3)',
            textShadow: '0 2px 10px rgba(0,0,0,0.5)',
            letterSpacing: 2,
          }}
        >
          🎭 Start Concert
        </button>

        {/* Upgrade Shop Button */}
        <button
          onClick={() => setShowUpgradeShop(true)}
          style={{
            marginTop: 12,
            padding: '12px 32px',
            fontSize: 16,
            fontWeight: 700,
            background: 'linear-gradient(135deg, #10b981, #059669)',
            color: '#fff',
            border: '2px solid rgba(255,255,255,0.1)',
            borderRadius: 16,
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.boxShadow = '0 6px 25px rgba(16, 185, 129, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 4px 15px rgba(16, 185, 129, 0.3)';
          }}
        >
          ⚡ Upgrade Shop
        </button>

        {/* Settings Button */}
        <button
          onClick={() => setShowSettings(true)}
          style={{
            padding: '12px 32px',
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
          ⚙️ Settings
        </button>

        {/* Difficulty Selector */}
        <div
          style={{
            display: 'flex',
            gap: 10,
            marginTop: 20,
            justifyContent: 'center',
          }}
        >
          {(['easy', 'normal', 'hard'] as Difficulty[]).map((d) => {
            const isActive = difficulty === d;
            const config = {
              easy:   { emoji: '🌸', label: 'Easy',   color: '#22c55e', desc: 'Relaxed pace, forgiving' },
              normal: { emoji: '🎭', label: 'Normal', color: '#8b5cf6', desc: 'The intended experience' },
              hard:   { emoji: '🔥', label: 'Hard',   color: '#ef4444', desc: 'Chaos moves fast!' },
            }[d];
            return (
              <button
                key={d}
                onClick={() => onDifficultyChange(d)}
                style={{
                  padding: '10px 20px',
                  fontSize: 13,
                  fontWeight: 700,
                  background: isActive
                    ? `linear-gradient(135deg, ${config.color}33, ${config.color}22)`
                    : 'rgba(255,255,255,0.04)',
                  color: isActive ? config.color : '#64748b',
                  border: `1.5px solid ${isActive ? config.color + '88' : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: 14,
                  cursor: 'pointer',
                  transition: 'all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                  transform: isActive ? 'scale(1.08)' : 'scale(1)',
                  boxShadow: isActive ? `0 4px 20px ${config.color}33` : 'none',
                  minWidth: 100,
                  textAlign: 'center' as const,
                }}
              >
                <div style={{ fontSize: 20, marginBottom: 2 }}>{config.emoji}</div>
                <div>{config.label}</div>
                <div style={{ fontSize: 9, opacity: 0.7, marginTop: 2 }}>{config.desc}</div>
              </button>
            );
          })}
        </div>

        {/* Instructions */}
        <div
          style={{
            marginTop: 40,
            display: 'flex',
            gap: 32,
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          <InstructionCard emoji="👆" title="Wave" desc="Move your mouse/finger over troubled sections" />
          <InstructionCard emoji="🔴" title="Fix" desc="Keep the baton moving over red sections to calm them" />
          <InstructionCard emoji="🎵" title="Beat" desc="Move ON the beat for 2x fix speed — watch the baton pulse!" />
          <InstructionCard emoji="⚡" title="Survive" desc="Unfixed chaos spreads to neighbors!" />
        </div>
      </div>

      {/* Upgrade Shop Modal */}
      {showUpgradeShop && <UpgradeShop onClose={() => setShowUpgradeShop(false)} />}

      {/* Settings Modal */}
      {showSettings && (
        <Settings
          onClose={() => setShowSettings(false)}
          onClearData={() => {
            localStorage.clear();
            window.location.reload();
          }}
        />
      )}
    </div>
  );
};

const InstructionCard: React.FC<{ emoji: string; title: string; desc: string }> = ({
  emoji,
  title,
  desc,
}) => {
  const [hovered, setHovered] = useState(false);
  return (
  <div
    onMouseEnter={() => setHovered(true)}
    onMouseLeave={() => setHovered(false)}
    style={{
      background: hovered ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.06)',
      borderRadius: 16,
      padding: '16px 20px',
      maxWidth: 160,
      textAlign: 'center',
      border: hovered ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid rgba(255,255,255,0.08)',
      backdropFilter: 'blur(8px)',
      transition: 'all 0.2s',
      transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
    }}
  >
    <div style={{ fontSize: 28, marginBottom: 6 }}>{emoji}</div>
    <div style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0', marginBottom: 4 }}>
      {title}
    </div>
    <div style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.4 }}>{desc}</div>
  </div>
);
};
