import React, { useState, useEffect } from 'react';
import type { MiniGameResult } from './types';

interface Props {
  onComplete: (result: MiniGameResult) => void;
}

export const RhythmMatch: React.FC<Props> = ({ onComplete }) => {
  const [pattern, setPattern] = useState<number[]>([]);
  const [userPattern, setUserPattern] = useState<number[]>([]);
  const [showPattern, setShowPattern] = useState(true);
  const [timeLeft, setTimeLeft] = useState(8);
  const [activeNote, setActiveNote] = useState<number | null>(null);

  useEffect(() => {
    // Generate random pattern
    const newPattern = Array.from({ length: 4 }, () => Math.floor(Math.random() * 4));
    setPattern(newPattern);

    // Show pattern for 2 seconds
    let step = 0;
    const interval = setInterval(() => {
      if (step < newPattern.length) {
        setActiveNote(newPattern[step]);
        setTimeout(() => setActiveNote(null), 400);
        step++;
      } else {
        clearInterval(interval);
        setTimeout(() => setShowPattern(false), 500);
      }
    }, 600);

    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          clearInterval(interval);
          checkResult();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
      clearInterval(interval);
    };
  }, []);

  const checkResult = () => {
    const correct = pattern.every((note, i) => note === userPattern[i]);
    const score = correct ? 1000 : Math.floor((userPattern.filter((n, i) => n === pattern[i]).length / pattern.length) * 500);
    onComplete({ success: correct, score, bonus: correct ? 500 : 0 });
  };

  const handleTap = (index: number) => {
    if (showPattern || userPattern.length >= pattern.length) return;
    setUserPattern([...userPattern, index]);
    setActiveNote(index);
    setTimeout(() => setActiveNote(null), 300);
    
    if (userPattern.length + 1 === pattern.length) {
      setTimeout(checkResult, 300);
    }
  };

  const colors = ['#ef4444', '#3b82f6', '#22c55e', '#fbbf24'];
  const labels = ['🥁', '🎺', '🎻', '🎵'];

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.95)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{ fontSize: 48, marginBottom: 20, color: '#fbbf24' }}>🎵 Rhythm Match</div>
      <div style={{ fontSize: 24, marginBottom: 20, color: '#e5e7eb' }}>Time: {timeLeft}s</div>
      
      {showPattern ? (
        <div style={{ fontSize: 20, marginBottom: 30, color: '#60a5fa' }}>Watch the pattern...</div>
      ) : (
        <div style={{ fontSize: 20, marginBottom: 30, color: '#22c55e' }}>Now repeat it!</div>
      )}

      <div style={{ display: 'flex', gap: 20, marginBottom: 30 }}>
        {pattern.map((note, i) => (
          <div
            key={i}
            style={{
              width: 60,
              height: 60,
              borderRadius: 12,
              background: showPattern ? colors[note] : '#333',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 32,
              opacity: showPattern ? 1 : 0.3,
              transform: activeNote === note ? 'scale(1.2)' : 'scale(1)',
              transition: 'transform 0.2s',
            }}
          >
            {showPattern && labels[note]}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 20, marginBottom: 20 }}>
        {userPattern.map((note, i) => (
          <div
            key={i}
            style={{
              width: 60,
              height: 60,
              borderRadius: 12,
              background: colors[note],
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 32,
            }}
          >
            {labels[note]}
          </div>
        ))}
      </div>

      {!showPattern && (
        <div style={{ display: 'flex', gap: 15 }}>
          {colors.map((color, i) => (
            <button
              key={i}
              onClick={() => handleTap(i)}
              style={{
                width: 80,
                height: 80,
                borderRadius: 16,
                background: color,
                border: 'none',
                fontSize: 40,
                cursor: 'pointer',
                transition: 'transform 0.1s',
                boxShadow: activeNote === i ? '0 0 30px ' + color : 'none',
              }}
              onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.9)'}
              onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              {labels[i]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
