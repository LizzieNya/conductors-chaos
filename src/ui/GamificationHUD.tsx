import React from 'react';
import { useGamificationStore } from '../gamification';

export const GamificationHUD: React.FC = () => {
  const stats = useGamificationStore((s) => s.stats);
  const dailyChallenge = useGamificationStore((s) => s.dailyChallenge);

  const xpProgress = (stats.xp % 1000) / 1000;
  const xpToNext = 1000 - (stats.xp % 1000);

  return (
    <div style={{
      position: 'fixed',
      top: 20,
      right: 20,
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      zIndex: 100,
      pointerEvents: 'none',
    }}>
      {/* Player Level & XP */}
      <div style={{
        background: 'rgba(0,0,0,0.8)',
        backdropFilter: 'blur(12px)',
        borderRadius: 12,
        padding: '12px 16px',
        border: '1px solid rgba(139, 92, 246, 0.3)',
        minWidth: 200,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <div style={{ fontSize: 24 }}>🎩</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#a78bfa' }}>
              Level {stats.level}
            </div>
            <div style={{ fontSize: 10, color: '#94a3b8' }}>
              {stats.title}
            </div>
          </div>
        </div>
        <div style={{
          width: '100%',
          height: 6,
          background: 'rgba(255,255,255,0.1)',
          borderRadius: 3,
          overflow: 'hidden',
        }}>
          <div style={{
            width: `${xpProgress * 100}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #8b5cf6, #a78bfa)',
            transition: 'width 0.3s',
          }} />
        </div>
        <div style={{ fontSize: 9, color: '#64748b', marginTop: 4 }}>
          {xpToNext} XP to next level
        </div>
      </div>

      {/* Streak */}
      {stats.currentStreak > 0 && (
        <div style={{
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(12px)',
          borderRadius: 12,
          padding: '10px 14px',
          border: '1px solid rgba(251, 191, 36, 0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <div style={{ fontSize: 24 }}>🔥</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#fbbf24' }}>
              {stats.currentStreak} Day Streak
            </div>
            <div style={{ fontSize: 9, color: '#94a3b8' }}>
              Best: {stats.longestStreak}
            </div>
          </div>
        </div>
      )}

      {/* Daily Challenge */}
      {dailyChallenge && !dailyChallenge.completed && (
        <div style={{
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(12px)',
          borderRadius: 12,
          padding: '10px 14px',
          border: '1px solid rgba(34, 197, 94, 0.3)',
          maxWidth: 250,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <div style={{ fontSize: 20 }}>{dailyChallenge.icon}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#22c55e' }}>
              Daily Challenge
            </div>
          </div>
          <div style={{ fontSize: 11, color: '#e5e7eb', marginBottom: 6 }}>
            {dailyChallenge.description}
          </div>
          <div style={{
            width: '100%',
            height: 4,
            background: 'rgba(255,255,255,0.1)',
            borderRadius: 2,
            overflow: 'hidden',
            marginBottom: 4,
          }}>
            <div style={{
              width: `${Math.min(100, (dailyChallenge.progress / dailyChallenge.requirement) * 100)}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #22c55e, #4ade80)',
              transition: 'width 0.3s',
            }} />
          </div>
          <div style={{ fontSize: 9, color: '#64748b' }}>
            {dailyChallenge.progress} / {dailyChallenge.requirement} • {dailyChallenge.reward} coins
          </div>
        </div>
      )}

      {dailyChallenge && dailyChallenge.completed && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(34, 197, 94, 0.1))',
          backdropFilter: 'blur(12px)',
          borderRadius: 12,
          padding: '10px 14px',
          border: '1px solid rgba(34, 197, 94, 0.5)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ fontSize: 20 }}>✅</div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#22c55e' }}>
                Challenge Complete!
              </div>
              <div style={{ fontSize: 10, color: '#86efac' }}>
                +{dailyChallenge.reward} coins earned
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
