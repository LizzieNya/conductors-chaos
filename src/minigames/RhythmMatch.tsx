import React, { useState, useEffect, useRef } from 'react';
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
  const [feedback, setFeedback] = useState<{ text: string; color: string } | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const feedbackTimer = useRef<number | null>(null);

  useEffect(() => {
    // Generate random pattern (4-6 notes based on difficulty)
    const patternLength = 4 + Math.floor(Math.random() * 3);
    const newPattern = Array.from({ length: patternLength }, () => Math.floor(Math.random() * 4));
    setPattern(newPattern);

    // Show pattern with visual and audio feedback
    let step = 0;
    const interval = setInterval(() => {
      if (step < newPattern.length) {
        setActiveNote(newPattern[step]);
        // Play sound for each note
        // audioMixer.playNote('percussion', false); // Would play correct percussion
        
        setTimeout(() => {
          setActiveNote(null);
          // Visual feedback for correct note
          setFeedback({ text: 'Good!', color: '#22c55e' });
          if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
          feedbackTimer.current = window.setTimeout(() => setFeedback(null), 300);
        }, 300);
        step++;
      } else {
        clearInterval(interval);
        setTimeout(() => setShowPattern(false), 800);
      }
    }, 700);

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
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    };
  }, []);

  const checkResult = () => {
    setGameOver(true);
    const correct = pattern.every((note, i) => note === userPattern[i]);
    const matches = userPattern.filter((n, i) => n === pattern[i]).length;
    const accuracy = matches / pattern.length;
    
    let finalScore = 0;
    let bonus = 0;
    let success = false;

    if (correct) {
      finalScore = 1500 + Math.floor(timeLeft * 100);
      bonus = 800;
      success = true;
      setFeedback({ text: 'PERFECT!', color: '#fbbf24' });
    } else if (accuracy >= 0.75) {
      finalScore = Math.floor(accuracy * 1200) + Math.floor(timeLeft * 50);
      bonus = 400;
      success = true;
      setFeedback({ text: 'Great!', color: '#22c55e' });
    } else if (accuracy >= 0.5) {
      finalScore = Math.floor(accuracy * 800);
      setFeedback({ text: 'Good effort', color: '#f59e0b' });
    } else {
      setFeedback({ text: 'Try again!', color: '#ef4444' });
    }

    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    feedbackTimer.current = window.setTimeout(() => setFeedback(null), 1500);

    setTimeout(() => {
      onComplete({ success, score: finalScore, bonus });
    }, 1000);
  };

  const handleTap = (index: number) => {
    if (showPattern || userPattern.length >= pattern.length || gameOver) return;
    
    const newPattern = [...userPattern, index];
    setUserPattern(newPattern);
    setActiveNote(index);
    
    // Play sound feedback
    // audioMixer.playNote('percussion', false);
    
    setTimeout(() => setActiveNote(null), 250);
    
    // Visual feedback
    setFeedback({ text: 'Tap!', color: '#60a5fa' });
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    feedbackTimer.current = window.setTimeout(() => setFeedback(null), 200);

    if (newPattern.length === pattern.length) {
      setTimeout(checkResult, 400);
    }
  };

  const colors = ['#ef4444', '#3b82f6', '#22c55e', '#fbbf24'];
  const labels = ['🥁', '🎺', '🎻', '🎵'];
  const noteNames = ['Kick', 'Snare', 'HiHat', 'Tom'];

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
        <span>🎵</span>
        <span>Rhythm Match</span>
      </div>
      
      <div style={{ 
        fontSize: 24, 
        marginBottom: 20, 
        color: '#e9d5ff',
        background: 'rgba(0,0,0,0.3)',
        padding: '8px 20px',
        borderRadius: 20,
      }}>
        Time: {timeLeft}s
      </div>

      {/* Feedback Display */}
      {feedback && !gameOver && (
        <div style={{
          fontSize: 36,
          fontWeight: 900,
          color: feedback.color,
          textShadow: `0 0 20px ${feedback.color}`,
          marginBottom: 20,
          animation: 'popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        }}>
          {feedback.text}
        </div>
      )}

      {/* Pattern Display */}
      {showPattern ? (
        <div style={{ 
          fontSize: 20, 
          marginBottom: 30, 
          color: '#60a5fa',
          animation: 'pulse 1.5s infinite',
        }}>
          Watch the pattern...
        </div>
      ) : (
        <div style={{ 
          fontSize: 20, 
          marginBottom: 30, 
          color: '#22c55e',
          animation: 'pulse 1.5s infinite',
        }}>
          Now repeat it!
        </div>
      )}

      {/* Pattern Notes */}
      <div style={{ 
        display: 'flex', 
        gap: 15, 
        marginBottom: 30,
        padding: 20,
        background: 'rgba(0,0,0,0.2)',
        borderRadius: 20,
      }}>
        {pattern.map((note, i) => (
          <div
            key={i}
            style={{
              width: 70,
              height: 70,
              borderRadius: 16,
              background: showPattern ? colors[note] : '#333',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 36,
              opacity: showPattern ? 1 : 0.4,
              transform: activeNote === note ? 'scale(1.3) rotate(10deg)' : 'scale(1)',
              transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
              border: showPattern && activeNote === note ? '4px solid #fff' : 'none',
            }}
          >
            {showPattern && labels[note]}
          </div>
        ))}
      </div>

      {/* User Pattern Display */}
      {userPattern.length > 0 && !showPattern && (
        <div style={{ 
          display: 'flex', 
          gap: 15, 
          marginBottom: 30,
          padding: 15,
          background: 'rgba(0,0,0,0.2)',
          borderRadius: 16,
        }}>
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
                animation: 'fadeIn 0.2s ease-out',
              }}
            >
              {labels[note]}
            </div>
          ))}
        </div>
      )}

      {/* Input Buttons */}
      {!showPattern && !gameOver && (
        <div style={{ display: 'flex', gap: 12 }}>
          {colors.map((color, i) => (
            <button
              key={i}
              onClick={() => handleTap(i)}
              style={{
                width: 90,
                height: 90,
                borderRadius: 18,
                background: `linear-gradient(135deg, ${color}, ${color}88)`,
                border: 'none',
                fontSize: 44,
                cursor: 'pointer',
                transition: 'all 0.1s',
                boxShadow: activeNote === i 
                  ? `0 0 40px ${color}, inset 0 0 20px rgba(255,255,255,0.3)` 
                  : `0 8px 20px ${color}40`,
                position: 'relative',
                overflow: 'hidden',
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = 'scale(0.95)';
                e.currentTarget.style.boxShadow = `0 4px 10px ${color}40`;
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = activeNote === i 
                  ? `0 0 40px ${color}, inset 0 0 20px rgba(255,255,255,0.3)` 
                  : `0 8px 20px ${color}40`;
              }}
            >
              {labels[i]}
              <div style={{
                position: 'absolute',
                top: 5,
                right: 5,
                fontSize: 10,
                fontWeight: 700,
                color: '#fff',
                textShadow: '0 1px 2px rgba(0,0,0,0.5)',
              }}>
                {noteNames[i]}
              </div>
            </button>
          ))}
        </div>
      )}

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
            {pattern.every((n, i) => n === userPattern[i]) ? '🎉 PERFECT!' : '🎵 Good Job!'}
          </div>
          <div style={{ fontSize: 24, color: '#fff', marginBottom: 30 }}>
            {pattern.every((n, i) => n === userPattern[i]) ? 'Perfect rhythm!' : `${userPattern.length}/${pattern.length} correct`}
          </div>
          <div style={{ fontSize: 14, color: '#94a3b8' }}>
            {pattern.every((n, i) => n === userPattern[i]) ? 'You matched the rhythm perfectly!' : 'Keep practicing your rhythm!'}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div style={{ 
        marginTop: 30, 
        fontSize: 14, 
        color: '#94a3b8',
        textAlign: 'center',
        maxWidth: 400,
      }}>
        Memorize the pattern and repeat it by tapping the instruments in order!
      </div>
    </div>
  );
};
