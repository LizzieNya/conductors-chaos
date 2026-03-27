import React, { useState, useEffect, useRef } from 'react';
import type { MiniGameResult } from './types';

interface Props {
  onComplete: (result: MiniGameResult) => void;
}

export const TempoTap: React.FC<Props> = ({ onComplete }) => {
  const [timeLeft, setTimeLeft] = useState(6);
  const [taps, setTaps] = useState<number[]>([]);
  const [beatTimes, setBeatTimes] = useState<number[]>([]);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [feedback, setFeedback] = useState<{ text: string; color: string; x: number; y: number } | null>(null);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const feedbackTimer = useRef<number | null>(null);
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
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    };
  }, []);

  const showFeedback = (text: string, color: string, x: number, y: number) => {
    setFeedback({ text, color, x, y });
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    feedbackTimer.current = window.setTimeout(() => setFeedback(null), 500);
  };

  const calculateScore = () => {
    let perfectTaps = 0;
    let goodTaps = 0;
    let badTaps = 0;

    taps.forEach((tapTime) => {
      const closestBeat = beatTimes.reduce((prev, curr) =>
        Math.abs(curr - tapTime) < Math.abs(prev - tapTime) ? curr : prev
      );
      const diff = Math.abs(closestBeat - tapTime);

      if (diff < 80) {
        perfectTaps++;
        setCombo(c => {
          const newCombo = c + 1;
          setMaxCombo(m => Math.max(m, newCombo));
          return newCombo;
        });
      } else if (diff < 150) {
        goodTaps++;
        setCombo(c => {
          const newCombo = c + 1;
          setMaxCombo(m => Math.max(m, newCombo));
          return newCombo;
        });
      } else {
        badTaps++;
        setCombo(0);
      }
    });

    const finalScore = perfectTaps * 250 + goodTaps * 150 + badTaps * 50;
    const success = perfectTaps >= 4;

    // Bonus for high combo
    const comboBonus = maxCombo >= 5 ? 500 : maxCombo >= 3 ? 300 : 0;

    onComplete({
      success,
      score: finalScore + comboBonus,
      bonus: perfectTaps >= 6 ? 800 : comboBonus,
    });
  };

  const handleTap = (e: React.MouseEvent | React.TouchEvent) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const x = e instanceof MouseEvent ? e.clientX : e.touches[0].clientX;
    const y = e instanceof MouseEvent ? e.clientY : e.touches[0].clientY;
    
    const tapTime = Date.now();
    setTaps([...taps, tapTime]);

    // Calculate timing feedback
    const closestBeat = beatTimes.reduce((prev, curr) =>
      Math.abs(curr - tapTime) < Math.abs(prev - tapTime) ? curr : prev
    );
    const diff = Math.abs(closestBeat - tapTime);

    let feedbackText = '';
    let feedbackColor = '';

    if (diff < 80) {
      feedbackText = 'PERFECT!';
      feedbackColor = '#fbbf24';
      // Play sound
      // audioMixer.playNote('percussion', false);
    } else if (diff < 150) {
      feedbackText = 'Good!';
      feedbackColor = '#22c55e';
    } else if (diff < 250) {
      feedbackText = 'Miss';
      feedbackColor = '#ef4444';
    } else {
      feedbackText = 'Too late!';
      feedbackColor = '#ef4444';
    }

    showFeedback(feedbackText, feedbackColor, x, y);
  };

  const beatPhase = (currentBeat % 4) + 1;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        overflow: 'hidden',
        cursor: 'pointer',
        userSelect: 'none',
      }}
      onClick={handleTap}
      onTouchStart={handleTap}
    >
      {/* Header */}
      <div style={{ 
        fontSize: 48, 
        fontWeight: 900, 
        marginBottom: 10, 
        color: '#fff',
        textShadow: '0 0 20px rgba(139, 92, 246, 0.5)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}>
        <span>👆</span>
        <span>Tempo Tap</span>
      </div>

      {/* Stats */}
      <div style={{ 
        fontSize: 20, 
        marginBottom: 30, 
        color: '#e9d5ff',
        display: 'flex',
        gap: 30,
      }}>
        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '8px 16px', borderRadius: 16 }}>
          Time: {timeLeft}s
        </div>
        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '8px 16px', borderRadius: 16 }}>
          Combo: x{combo}
        </div>
        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '8px 16px', borderRadius: 16 }}>
          Max: x{maxCombo}
        </div>
      </div>

      {/* Beat Indicators */}
      <div style={{ 
        display: 'flex', 
        gap: 20, 
        marginBottom: 40,
        padding: 20,
        background: 'rgba(0,0,0,0.2)',
        borderRadius: 20,
      }}>
        {[1, 2, 3, 4].map((beat) => (
          <div
            key={beat}
            style={{
              width: 70,
              height: 70,
              borderRadius: '50%',
              background: beatPhase === beat 
                ? 'linear-gradient(135deg, #fbbf24, #f59e0b)' 
                : 'linear-gradient(135deg, #a78bfa, #7e22ce)',
              border: beatPhase === beat ? '4px solid #fff' : '3px solid #c4b5fd',
              boxShadow: beatPhase === beat 
                ? '0 0 40px #fbbf24, inset 0 0 20px rgba(255,255,255,0.3)' 
                : 'none',
              transition: 'all 0.1s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 24,
              fontWeight: 900,
              color: '#fff',
            }}
          >
            {beat}
          </div>
        ))}
      </div>

      {/* Main Tap Target */}
      <div
        style={{
          fontSize: 120,
          animation: 'pulse 0.5s ease-in-out infinite',
          cursor: 'pointer',
          userSelect: 'none',
          position: 'relative',
        }}
      >
        🥁
        {/* Ripple effect on beat */}
        {beatPhase === 1 && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 160,
            height: 160,
            borderRadius: '50%',
            border: '4px solid rgba(251, 191, 36, 0.5)',
            animation: 'ripple 0.5s ease-out',
          }} />
        )}
      </div>

      {/* Feedback Display */}
      {feedback && (
        <div style={{
          position: 'absolute',
          left: feedback.x,
          top: feedback.y,
          transform: 'translate(-50%, -50%)',
          fontSize: 36,
          fontWeight: 900,
          color: feedback.color,
          textShadow: `0 0 20px ${feedback.color}`,
          pointerEvents: 'none',
          animation: 'floatUp 0.5s ease-out forwards',
        }}>
          {feedback.text}
        </div>
      )}

      <div style={{ 
        fontSize: 20, 
        marginTop: 40, 
        color: '#e9d5ff',
        textAlign: 'center',
      }}>
        Tap on the beat! <br />
        <span style={{ fontSize: 14, color: '#94a3b8' }}>
          Perfect: < 80ms | Good: < 150ms
        </span>
      </div>
    </div>
  );
};
