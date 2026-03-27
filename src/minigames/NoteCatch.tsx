import React, { useState, useEffect, useRef } from 'react';
import type { MiniGameResult } from './types';

interface Note {
  id: number;
  x: number;
  y: number;
  type: string;
  speed: number;
  color: string;
  value: number;
}

interface Props {
  onComplete: (result: MiniGameResult) => void;
}

export const NoteCatch: React.FC<Props> = ({ onComplete }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [basketX, setBasketX] = useState(400);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [powerUp, setPowerUp] = useState<{ x: number; y: number; type: string } | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const noteIdRef = useRef(0);
  const powerUpTimer = useRef<number | null>(null);

  useEffect(() => {
    // Spawn notes
    const spawnInterval = setInterval(() => {
      const types = ['♪', '♫', '♬', '🎵', '🎶'];
      const colors = ['#fbbf24', '#3b82f6', '#22c55e', '#f59e0b', '#ec4899'];
      const values = [100, 150, 200, 250, 300];
      
      setNotes((prev) => [
        ...prev,
        {
          id: noteIdRef.current++,
          x: Math.random() * 600 + 100,
          y: -50,
          type: types[Math.floor(Math.random() * types.length)],
          speed: 3 + Math.random() * 3 + (10 - timeLeft) * 0.2,
          color: colors[Math.floor(Math.random() * colors.length)],
          value: values[Math.floor(Math.random() * values.length)],
        },
      ]);
    }, 700);

    // Spawn power-ups occasionally
    const powerUpInterval = setInterval(() => {
      if (Math.random() < 0.3 && !powerUp && !gameOver) {
        setPowerUp({
          x: Math.random() * 600 + 100,
          y: -50,
          type: ['speed', 'multiplier', 'extraTime'][Math.floor(Math.random() * 3)],
        });
      }
    }, 3000);

    // Update notes
    const updateInterval = setInterval(() => {
      setNotes((prev) =>
        prev
          .map((note) => ({ ...note, y: note.y + note.speed }))
          .filter((note) => {
            // Check collision with basket
            if (
              note.y > 450 &&
              note.y < 500 &&
              note.x > basketX - 50 &&
              note.x < basketX + 50
            ) {
              // Caught!
              const points = note.value * (1 + combo * 0.1);
              setScore((s) => s + Math.floor(points));
              setCombo((c) => {
                const newCombo = Math.min(c + 1, 20);
                setMaxCombo(m => Math.max(m, newCombo));
                return newCombo;
              });
              return false;
            }
            // Reset combo on miss
            if (note.y > 520) {
              setCombo(0);
            }
            return note.y < 520;
          })
      );

      // Update power-up
      if (powerUp && !gameOver) {
        setPowerUp((p) => {
          if (!p) return null;
          const newY = p.y + 3;
          
          // Check power-up collection
          if (newY > 450 && newY < 500 && p.x > basketX - 50 && p.x < basketX + 50) {
            // Collect power-up
            if (p.type === 'speed') {
              // Speed power-up logic
            } else if (p.type === 'multiplier') {
              // Multiplier logic
            } else if (p.type === 'extraTime') {
              setTimeLeft(t => Math.min(t + 3, 10));
            }
            return null;
          }
          
          return newY > 520 ? null : { ...p, y: newY };
        });
      }
    }, 16);

    // Countdown
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          clearInterval(spawnInterval);
          clearInterval(updateInterval);
          clearInterval(powerUpInterval);
          if (powerUpTimer.current) clearTimeout(powerUpTimer.current);
          setGameOver(true);
          calculateScore();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => {
      clearInterval(spawnInterval);
      clearInterval(updateInterval);
      clearInterval(timer);
      clearInterval(powerUpInterval);
      if (powerUpTimer.current) clearTimeout(powerUpTimer.current);
    };
  }, [basketX, score, combo, timeLeft, powerUp, gameOver]);

  const calculateScore = () => {
    const success = score >= 800;
    const bonus = score >= 1500 ? 800 : maxCombo >= 10 ? 500 : 0;
    onComplete({
      success,
      score,
      bonus,
    });
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'linear-gradient(180deg, #0f172a 0%, #1e1b4b 100%)',
        overflow: 'hidden',
        zIndex: 1000,
        cursor: 'none',
      }}
      onMouseMove={(e) => setBasketX(e.clientX)}
      onTouchMove={(e) => setBasketX(e.touches[0].clientX)}
    >
      {/* HUD */}
      <div style={{
        position: 'absolute',
        top: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        fontSize: 32,
        color: '#fff',
        textAlign: 'center',
        textShadow: '0 2px 10px rgba(0,0,0,0.5)',
      }}>
        <div style={{ fontSize: 40, fontWeight: 900, marginBottom: 10 }}>
          🎶 Note Catcher
        </div>
        <div style={{ 
          display: 'flex', 
          gap: 20, 
          justifyContent: 'center',
          fontSize: 18,
        }}>
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '6px 14px', borderRadius: 12 }}>
            Score: {score}
          </div>
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '6px 14px', borderRadius: 12 }}>
            Time: {timeLeft}s
          </div>
          <div style={{ 
            background: combo > 1 ? 'linear-gradient(135deg, #fbbf24, #f59e0b)' : 'rgba(0,0,0,0.3)',
            padding: '6px 14px', 
            borderRadius: 12,
            fontWeight: combo > 1 ? 900 : 400,
          }}>
            Combo: x{combo}
          </div>
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '6px 14px', borderRadius: 12 }}>
            Max: x{maxCombo}
          </div>
        </div>
      </div>

      {/* Notes */}
      {notes.map((note) => (
        <div
          key={note.id}
          style={{
            position: 'absolute',
            left: note.x,
            top: note.y,
            fontSize: 36,
            transform: 'rotate(15deg)',
            filter: `drop-shadow(0 0 10px ${note.color})`,
            animation: 'spin 2s linear infinite',
          }}
        >
          {note.type}
        </div>
      ))}

      {/* Power-up */}
      {powerUp && (
        <div
          style={{
            position: 'absolute',
            left: powerUp.x,
            top: powerUp.y,
            fontSize: 40,
            animation: 'pulse 0.5s ease-in-out infinite',
          }}
        >
          {powerUp.type === 'speed' ? '⚡' : powerUp.type === 'multiplier' ? '🔥' : '⏰'}
        </div>
      )}

      {/* Basket */}
      <div
        style={{
          position: 'absolute',
          left: basketX - 50,
          bottom: 20,
          width: 100,
          height: 70,
          background: 'linear-gradient(180deg, #fbbf24 0%, #f59e0b 100%)',
          borderRadius: '10px 10px 50px 50px',
          border: '4px solid #d97706',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 40,
          boxShadow: '0 10px 30px rgba(251, 191, 36, 0.4)',
          transform: `rotate(${(basketX - 400) * 0.05}deg)`,
          transition: 'transform 0.1s',
        }}
      >
        🎺
      </div>

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
            {score >= 800 ? '🎉 PERFECT!' : '🎵 Good Job!'}
          </div>
          <div style={{ fontSize: 24, color: '#fff', marginBottom: 30 }}>
            Score: {score} | Max Combo: x{maxCombo}
          </div>
          <div style={{ fontSize: 14, color: '#94a3b8' }}>
            {score >= 800 ? 'You caught all the notes!' : 'Keep practicing!'}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div style={{
        position: 'absolute',
        bottom: 10,
        left: '50%',
        transform: 'translateX(-50%)',
        fontSize: 14,
        color: '#94a3b8',
        textAlign: 'center',
      }}>
        Move mouse/touch to catch notes! <br />
        <span style={{ fontSize: 12 }}>
          Catch notes in combo for bonus points!
        </span>
      </div>
    </div>
  );
};
