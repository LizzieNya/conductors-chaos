import React, { useState, useEffect, useRef } from 'react';
import type { MiniGameResult } from './types';

interface Note {
  id: number;
  x: number;
  y: number;
  type: string;
  speed: number;
}

interface Props {
  onComplete: (result: MiniGameResult) => void;
}

export const NoteCatch: React.FC<Props> = ({ onComplete }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [basketX, setBasketX] = useState(400);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const noteIdRef = useRef(0);

  useEffect(() => {
    // Spawn notes
    const spawnInterval = setInterval(() => {
      setNotes((prev) => [
        ...prev,
        {
          id: noteIdRef.current++,
          x: Math.random() * 700 + 50,
          y: 0,
          type: ['♪', '♫', '♬', '🎵'][Math.floor(Math.random() * 4)],
          speed: 2 + Math.random() * 2,
        },
      ]);
    }, 800);

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
              note.x > basketX - 40 &&
              note.x < basketX + 40
            ) {
              setScore((s) => s + 100);
              return false;
            }
            return note.y < 520;
          })
      );
    }, 16);

    // Countdown
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          clearInterval(spawnInterval);
          clearInterval(updateInterval);
          onComplete({
            success: score >= 500,
            score,
            bonus: score >= 1000 ? 500 : 0,
          });
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => {
      clearInterval(spawnInterval);
      clearInterval(updateInterval);
      clearInterval(timer);
    };
  }, [basketX, score]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'linear-gradient(180deg, #1a0a2e 0%, #0f3460 100%)',
        overflow: 'hidden',
        zIndex: 1000,
      }}
      onMouseMove={(e) => setBasketX(e.clientX)}
    >
      <div style={{
        position: 'absolute',
        top: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        fontSize: 32,
        color: '#fff',
        textAlign: 'center',
      }}>
        <div>🎶 Note Catcher</div>
        <div style={{ fontSize: 20, marginTop: 10 }}>
          Score: {score} | Time: {timeLeft}s
        </div>
      </div>

      {notes.map((note) => (
        <div
          key={note.id}
          style={{
            position: 'absolute',
            left: note.x,
            top: note.y,
            fontSize: 32,
            pointerEvents: 'none',
          }}
        >
          {note.type}
        </div>
      ))}

      <div
        style={{
          position: 'absolute',
          left: basketX - 40,
          bottom: 20,
          width: 80,
          height: 60,
          background: 'linear-gradient(180deg, #fbbf24 0%, #f59e0b 100%)',
          borderRadius: '8px 8px 40px 40px',
          border: '3px solid #d97706',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 32,
        }}
      >
        🎺
      </div>
    </div>
  );
};
