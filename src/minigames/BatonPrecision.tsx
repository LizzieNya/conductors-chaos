import React, { useState, useEffect, useRef } from 'react';
import type { MiniGameResult } from './types';

interface Pattern {
  x: number;
  y: number;
  radius: number;
  color: string;
}

interface Props {
  onComplete: (result: MiniGameResult) => void;
}

export const BatonPrecision: React.FC<Props> = ({ onComplete }) => {
  const [pattern, setPattern] = useState<Pattern[]>([]);
  const [currentPattern, setCurrentPattern] = useState<Pattern[]>([]);
  const [timeLeft, setTimeLeft] = useState(10);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Generate pattern (3 circles to hit)
    const newPattern: Pattern[] = [
      { x: 300, y: 260, radius: 40, color: '#ef4444' },
      { x: 500, y: 260, radius: 40, color: '#3b82f6' },
      { x: 400, y: 150, radius: 40, color: '#22c55e' },
    ];
    setPattern(newPattern);
    setCurrentPattern(newPattern);

    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          setGameOver(true);
          calculateScore();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const calculateScore = () => {
    const hits = 3 - currentPattern.length;
    const score = hits * 500;
    const success = hits >= 3;
    onComplete({
      success,
      score,
      bonus: success ? 500 : 0,
    });
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (gameOver || currentPattern.length === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = 800 / rect.width;
    const scaleY = 520 / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    // Check if clicked on any target
    let hit = false;
    const newPattern = currentPattern.filter((target) => {
      const dx = x - target.x;
      const dy = y - target.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < target.radius) {
        hit = true;
        setScore((s) => s + 500);
        return false; // Remove hit target
      }
      return true;
    });

    if (!hit) {
      // Missed - reduce score
      setScore((s) => Math.max(0, s - 100));
    }

    setCurrentPattern(newPattern);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{ fontSize: 48, marginBottom: 20, color: '#fbbf24' }}>
        🎯 Baton Precision
      </div>
      <div style={{ fontSize: 20, marginBottom: 20, color: '#e5e7eb' }}>
        Click the targets! | Time: {timeLeft}s | Score: {score}
      </div>

      <canvas
        ref={canvasRef}
        width={800}
        height={520}
        onClick={handleCanvasClick}
        style={{
          width: 800,
          height: 520,
          background: 'rgba(0,0,0,0.3)',
          borderRadius: 12,
          cursor: 'crosshair',
        }}
      />

      {/* Game Over Overlay */}
      {gameOver && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1001,
          animation: 'fadeIn 0.3s ease-out',
        }}>
          <div style={{ fontSize: 48, fontWeight: 900, color: '#fbbf24', marginBottom: 20 }}>
            {score >= 1500 ? '🎉 PERFECT!' : '🎯 Good Aim!'}
          </div>
          <div style={{ fontSize: 24, color: '#fff', marginBottom: 30 }}>
            Score: {score}
          </div>
          <div style={{ fontSize: 14, color: '#94a3b8' }}>
            {score >= 1500 ? 'You hit all targets!' : 'Keep practicing your aim!'}
          </div>
        </div>
      )}

      <div style={{ marginTop: 20, fontSize: 14, color: '#94a3b8' }}>
        Click all {pattern.length} targets before time runs out!
      </div>
    </div>
  );
};
