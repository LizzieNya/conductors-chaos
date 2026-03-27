import React, { useState, useEffect } from 'react';
import type { MiniGameResult } from './types';

interface Command {
  text: string;
  action: 'up' | 'down' | 'left' | 'right' | 'space';
  isTrick: boolean;
}

interface Props {
  onComplete: (result: MiniGameResult) => void;
}

export const ConductorSays: React.FC<Props> = ({ onComplete }) => {
  const [commands, setCommands] = useState<Command[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [failed, setFailed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(10);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    const commandList: Command[] = [
      { text: 'Conductor says: Wave UP! ⬆️', action: 'up', isTrick: false },
      { text: 'Conductor says: Wave DOWN! ⬇️', action: 'down', isTrick: false },
      { text: 'Wave LEFT! ⬅️', action: 'left', isTrick: true },
      { text: 'Conductor says: Wave RIGHT! ➡️', action: 'right', isTrick: false },
      { text: 'Tap the baton! 🎵', action: 'space', isTrick: true },
      { text: 'Conductor says: Wave UP! ⬆️', action: 'up', isTrick: false },
      { text: 'Wave DOWN! ⬇️', action: 'down', isTrick: true },
      { text: 'Conductor says: Tap the baton! 🎵', action: 'space', isTrick: false },
    ];
    setCommands(commandList);

    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          finishGame();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (currentIndex >= commands.length || failed || gameOver) return;

      const current = commands[currentIndex];
      let pressed: string = '';

      if (e.key === 'ArrowUp') pressed = 'up';
      else if (e.key === 'ArrowDown') pressed = 'down';
      else if (e.key === 'ArrowLeft') pressed = 'left';
      else if (e.key === 'ArrowRight') pressed = 'right';
      else if (e.key === ' ') pressed = 'space';
      else return;

      if (current.isTrick) {
        // Should NOT press on trick commands
        setFailed(true);
        setTimeout(finishGame, 500);
      } else if (pressed === current.action) {
        // Correct!
        setScore((s) => s + 200);
        setCurrentIndex((i) => {
          if (i + 1 >= commands.length) {
            setTimeout(finishGame, 500);
          }
          return i + 1;
        });
      } else {
        // Wrong key
        setFailed(true);
        setTimeout(finishGame, 500);
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [currentIndex, commands, failed, gameOver]);

  const finishGame = () => {
    setGameOver(true);
    const success = !failed && currentIndex >= commands.length;
    const bonus = success ? 800 : 0;
    onComplete({
      success,
      score,
      bonus,
    });
  };

  const current = commands[currentIndex];

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: failed ? 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%)' : 'linear-gradient(135deg, #065f46 0%, #047857 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{ fontSize: 48, marginBottom: 20, color: '#fff' }}>🎩 Conductor Says</div>
      <div style={{ fontSize: 20, marginBottom: 40, color: '#d1fae5' }}>
        Score: {score} | Time: {timeLeft}s
      </div>

      {current && !failed && !gameOver && (
        <div style={{
          fontSize: 36,
          fontWeight: 'bold',
          color: current.isTrick ? '#fbbf24' : '#fff',
          textAlign: 'center',
          padding: '30px 50px',
          background: 'rgba(0,0,0,0.3)',
          borderRadius: 20,
          marginBottom: 40,
          animation: 'popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        }}>
          {current.text}
        </div>
      )}

      {failed && !gameOver && (
        <div style={{ fontSize: 48, color: '#fca5a5', animation: 'shake 0.5s' }}>❌ Wrong!</div>
      )}

      {currentIndex >= commands.length && !failed && !gameOver && (
        <div style={{ fontSize: 48, color: '#6ee7b7', animation: 'popIn 0.3s' }}>✅ Perfect!</div>
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
          <div style={{ fontSize: 48, fontWeight: 900, color: failed ? '#ef4444' : '#22c55e', marginBottom: 20 }}>
            {failed ? '❌ GAME OVER' : '🎉 PERFECT!'}
          </div>
          <div style={{ fontSize: 24, color: '#fff', marginBottom: 30 }}>
            Score: {score}
          </div>
          <div style={{ fontSize: 14, color: '#94a3b8' }}>
            {failed ? 'You made a mistake!' : 'You followed all commands correctly!'}
          </div>
        </div>
      )}

      <div style={{ fontSize: 16, color: '#d1fae5', textAlign: 'center', marginTop: 40 }}>
        Only follow commands that say "Conductor says"!<br />
        Use arrow keys and spacebar
      </div>
    </div>
  );
};
