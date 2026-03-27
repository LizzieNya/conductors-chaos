import React, { useState, useEffect } from 'react';
import type { MiniGameResult } from './types';

interface Props {
  onComplete: (result: MiniGameResult) => void;
}

export const PitchPerfect: React.FC<Props> = ({ onComplete }) => {
  const [targetNote, setTargetNote] = useState(0);
  const [currentNote, setCurrentNote] = useState(0);
  const [timeLeft, setTimeLeft] = useState(8);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    // Generate target note
    const newTarget = Math.floor(Math.random() * 8);
    setTargetNote(newTarget);
    setCurrentNote(4); // Start in middle

    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          calculateScore();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const calculateScore = () => {
    setGameOver(true);
    const diff = Math.abs(targetNote - currentNote);
    let points = 0;
    let success = false;

    if (diff === 0) {
      points = 500;
      success = true;
    } else if (diff === 1) {
      points = 300;
      success = true;
    } else if (diff === 2) {
      points = 150;
      success = true;
    }

    onComplete({
      success,
      score: points,
      bonus: success ? 300 : 0,
    });
  };

  const handleAdjust = (direction: 'up' | 'down') => {
    setCurrentNote((n) => {
      const newN = direction === 'up' ? n + 1 : n - 1;
      return Math.max(0, Math.min(8, newN));
    });
  };

  const notes = ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C2', 'D2'];

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{ fontSize: 48, marginBottom: 20, color: '#c4b5fd' }}>
        🎤 Pitch Perfect
      </div>
      <div style={{ fontSize: 20, marginBottom: 40, color: '#e9d5ff' }}>
        Match the target pitch! | Time: {timeLeft}s
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 40 }}>
        <div style={{ fontSize: 24, color: '#94a3b8' }}>Target:</div>
        <div style={{
          width: 60,
          height: 60,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 32,
          fontWeight: 'bold',
          color: '#fff',
          border: '3px solid #c4b5fd',
        }}>
          {notes[targetNote]}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 40 }}>
        <div style={{ fontSize: 24, color: '#94a3b8' }}>Your Pitch:</div>
        <div style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #22c55e, #16a34a)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 40,
          fontWeight: 'bold',
          color: '#fff',
          border: '4px solid #86efac',
          boxShadow: '0 0 30px rgba(34, 197, 94, 0.5)',
        }}>
          {notes[currentNote]}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 20 }}>
        <button
          onClick={() => handleAdjust('down')}
          style={{
            width: 80,
            height: 80,
            borderRadius: 16,
            background: 'linear-gradient(135deg, #ef4444, #dc2626)',
            border: 'none',
            fontSize: 32,
            color: '#fff',
            cursor: 'pointer',
            transition: 'transform 0.1s',
            boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)',
          }}
          onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.9)'}
          onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          ⬇️
        </button>
        <button
          onClick={() => handleAdjust('up')}
          style={{
            width: 80,
            height: 80,
            borderRadius: 16,
            background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
            border: 'none',
            fontSize: 32,
            color: '#fff',
            cursor: 'pointer',
            transition: 'transform 0.1s',
            boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)',
          }}
          onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.9)'}
          onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          ⬆️
        </button>
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
            {Math.abs(targetNote - currentNote) <= 2 ? '🎉 PERFECT!' : '🎵 Good Job!'}
          </div>
          <div style={{ fontSize: 24, color: '#fff', marginBottom: 30 }}>
            {Math.abs(targetNote - currentNote) === 0 ? 'Exact match!' : `Close! Diff: ${Math.abs(targetNote - currentNote)}`}
          </div>
          <div style={{ fontSize: 14, color: '#94a3b8' }}>
            {Math.abs(targetNote - currentNote) <= 2 ? 'You matched the pitch!' : 'Keep practicing your ear!'}
          </div>
        </div>
      )}

      <div style={{ marginTop: 30, fontSize: 14, color: '#94a3b8' }}>
        Adjust pitch to match target!
      </div>
    </div>
  );
};
