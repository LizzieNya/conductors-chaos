import React, { useState, useEffect } from 'react';
import type { MiniGameResult } from './types';

interface Props {
  onComplete: (result: MiniGameResult) => void;
}

export const TempoTap: React.FC<Props> = ({ onComplete }) => {
  const [timeLeft, setTimeLeft] = useState(6);
  const [taps, setTaps] = useState<number[]>([]);
  const [beatTimes, setBeatTimes] = useState<number[]>([]);
  const [currentBeat, setCurrentBeat] = useState(0);
  const bpm = 120;
  const beatInterval = 60000 / bpm;

  useEffect(() => {
    const startTime = Date.now();
    const beats: number[] = [];
    for (let i = 0; i < 8; i++) {
      beats.push(startTime + i * beatInterval);
    }
    setBeatTimes(beats);

    const beatTimer = setInterval(() => {
      setCurrentBeat((b) => b + 1);
    }, beatInterval);

    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          clearInterval(beatTimer);
          calculateScore();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
      clearInterval(beatTimer);
    };
  }, []);

  const calculateScore = () => {
    let perfectTaps = 0;
    let goodTaps = 0;

    taps.forEach((tapTime) => {
      const closestBeat = beatTimes.reduce((prev, curr) =>
        Math.abs(curr - tapTime) < Math.abs(prev - tapTime) ? curr : prev
      );
      const diff = Math.abs(closestBeat - tapTime);

      if (diff < 100) perfectTaps++;
      else if (diff < 200) goodTaps++;
    });

    const finalScore = perfectTaps * 200 + goodTaps * 100;
    const success = perfectTaps >= 5;

    onComplete({
      success,
      score: finalScore,
      bonus: perfectTaps >= 7 ? 500 : 0,
    });
  };

  const handleTap = () => {
    setTaps([...taps, Date.now()]);
  };

  const beatPhase = (currentBeat % 4) + 1;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'radial-gradient(circle, #8b5cf6 0%, #5b21b6 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={handleTap}
    >
      <div style={{ fontSize: 48, marginBottom: 20, color: '#fff' }}>👆 Tempo Tap</div>
      <div style={{ fontSize: 24, marginBottom: 40, color: '#e9d5ff' }}>
        Time: {timeLeft}s | Taps: {taps.length}
      </div>

      <div style={{ display: 'flex', gap: 15, marginBottom: 40 }}>
        {[1, 2, 3, 4].map((beat) => (
          <div
            key={beat}
            style={{
              width: 60,
              height: 60,
              borderRadius: '50%',
              background: beatPhase === beat ? '#fbbf24' : '#a78bfa',
              border: '4px solid #fff',
              boxShadow: beatPhase === beat ? '0 0 30px #fbbf24' : 'none',
              transition: 'all 0.1s',
            }}
          />
        ))}
      </div>

      <div
        style={{
          fontSize: 120,
          animation: 'pulse 0.5s ease-in-out infinite',
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        🥁
      </div>

      <div style={{ fontSize: 20, marginTop: 40, color: '#e9d5ff' }}>
        Tap on the beat!
      </div>
    </div>
  );
};
