import React, { useState, useEffect } from 'react';
import type { MiniGameResult } from './types';

interface Props {
  onComplete: (result: MiniGameResult) => void;
}

export const InstrumentMemory: React.FC<Props> = ({ onComplete }) => {
  const [sequence, setSequence] = useState<number[]>([]);
  const [userSequence, setUserSequence] = useState<number[]>([]);
  const [showSequence, setShowSequence] = useState(true);
  const [timeLeft, setTimeLeft] = useState(12);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // Generate sequence (5 instruments)
    const newSequence = Array.from({ length: 5 }, () => Math.floor(Math.random() * 4));
    setSequence(newSequence);

    // Show sequence
    let step = 0;
    const interval = setInterval(() => {
      if (step < newSequence.length) {
        setCurrentStep(step);
        step++;
      } else {
        clearInterval(interval);
        setShowSequence(false);
        setCurrentStep(0);
      }
    }, 800);

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
    const correct = sequence.every((note, i) => note === userSequence[i]);
    const score = correct ? 1500 : Math.floor((userSequence.filter((n, i) => n === sequence[i]).length / sequence.length) * 1000);
    onComplete({
      success: correct,
      score,
      bonus: correct ? 500 : 0,
    });
  };

  const instruments = ['🎻', '🎺', '🎵', '🥁'];
  const colors = ['#3b82f6', '#f59e0b', '#10b981', '#8b5cf6'];

  const handleSelect = (index: number) => {
    if (showSequence) return;

    const newSequence = [...userSequence, index];
    setUserSequence(newSequence);

    if (newSequence.length === sequence.length) {
      setTimeout(checkResult, 500);
    }
  };

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
      <div style={{ fontSize: 48, marginBottom: 20, color: '#fbbf24' }}>
        🎺 Instrument Memory
      </div>
      <div style={{ fontSize: 20, marginBottom: 30, color: '#e5e7eb' }}>
        Time: {timeLeft}s | Sequence: {userSequence.length}/{sequence.length}
      </div>

      {showSequence ? (
        <div style={{ fontSize: 24, marginBottom: 40, color: '#60a5fa' }}>
          Watch the sequence...
        </div>
      ) : (
        <div style={{ fontSize: 24, marginBottom: 40, color: '#22c55e' }}>
          Now repeat it!
        </div>
      )}

      <div style={{ display: 'flex', gap: 20, marginBottom: 40 }}>
        {sequence.map((inst, i) => (
          <div
            key={i}
            style={{
              width: 70,
              height: 70,
              borderRadius: 16,
              background: showSequence ? colors[inst] : '#333',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 36,
              opacity: showSequence ? 1 : 0.3,
              border: showSequence && i === currentStep ? '4px solid #fff' : 'none',
            }}
          >
            {showSequence && instruments[inst]}
          </div>
        ))}
      </div>

      {!showSequence && (
        <div style={{ display: 'flex', gap: 15 }}>
          {instruments.map((inst, i) => (
            <button
              key={i}
              onClick={() => handleSelect(i)}
              style={{
                width: 80,
                height: 80,
                borderRadius: 16,
                background: colors[i],
                border: 'none',
                fontSize: 40,
                cursor: 'pointer',
                transition: 'transform 0.1s',
              }}
            >
              {inst}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
