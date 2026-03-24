import React, { useState, useEffect } from 'react';
import { useLeaderboardStore } from '../leaderboard';
import { useGameStore } from '../store';
import type { LeaderboardEntry } from '../leaderboard';

export const Leaderboard: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [scores, setScores] = useState<LeaderboardEntry[]>([]);
  const [filter, setFilter] = useState<'all' | 'today' | 'week'>('all');
  const [showNameInput, setShowNameInput] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [lastScore, setLastScore] = useState(0);
  const [lastStars, setLastStars] = useState(0);
  const [lastLevel, setLastLevel] = useState(1);

  useEffect(() => {
    const leaderboard = useLeaderboardStore.getState();
    setScores(leaderboard.getLeaderboard());
  }, []);

  const handleSaveScore = () => {
    if (!playerName.trim()) return;
    
    const leaderboard = useLeaderboardStore.getState();
    leaderboard.addScore(playerName, lastScore, lastStars, lastLevel);
    setScores(leaderboard.getLeaderboard());
    setShowNameInput(false);
    setPlayerName('');
  };

  // Set last score data from game
  useEffect(() => {
    const store = useGameStore.getState();
    const scoreData = store.getScoreData();
    setLastScore(scoreData.totalScore);
    setLastStars(scoreData.stars);
    setLastLevel(store.currentLevel);
  }, []);

  const filteredScores = scores.filter((s) => {
    if (filter === 'all') return true;
    const date = new Date(s.date);
    const now = new Date();
    const diffDays = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
    if (filter === 'today') return diffDays < 1;
    if (filter === 'week') return diffDays < 7;
    return true;
  });

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.9)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        width: 600,
        maxHeight: '90vh',
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
        borderRadius: 20,
        padding: 30,
        overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 32, fontWeight: 900, color: '#fbbf24' }}>
            🏆 Leaderboard
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              fontSize: 24,
              cursor: 'pointer',
              padding: '5px 10px',
              borderRadius: 8,
            }}
          >
            ✕
          </button>
        </div>

        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          {['all', 'today', 'week'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                background: filter === f ? '#8b5cf6' : 'rgba(255,255,255,0.1)',
                color: filter === f ? '#fff' : '#94a3b8',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Top 3 Podium */}
        {filteredScores.length >= 3 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginBottom: 30 }}>
            {filteredScores.slice(1, 2).map((s) => (
              <div key={s.id} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 5 }}>🥈</div>
                <div style={{ fontSize: 14, color: '#e5e7eb' }}>{s.name}</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#fbbf24' }}>{s.score.toLocaleString()}</div>
              </div>
            ))}
            {filteredScores.slice(0, 1).map((s) => (
              <div key={s.id} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 64, marginBottom: 5 }}>🥇</div>
                <div style={{ fontSize: 16, color: '#fbbf24' }}>{s.name}</div>
                <div style={{ fontSize: 32, fontWeight: 900, color: '#fbbf24' }}>{s.score.toLocaleString()}</div>
              </div>
            ))}
            {filteredScores.slice(2, 3).map((s) => (
              <div key={s.id} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 5 }}>🥉</div>
                <div style={{ fontSize: 14, color: '#e5e7eb' }}>{s.name}</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#fbbf24' }}>{s.score.toLocaleString()}</div>
              </div>
            ))}
          </div>
        )}

        {/* Score List */}
        <div style={{
          maxHeight: 300,
          overflowY: 'auto',
          background: 'rgba(0,0,0,0.2)',
          borderRadius: 12,
          padding: 10,
        }}>
          {filteredScores.map((s, i) => (
            <div
              key={s.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '10px 15px',
                background: i % 2 === 0 ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)',
                borderRadius: 8,
                marginBottom: 5,
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  background: i === 0 ? '#fbbf24' : i === 1 ? '#c084fc' : i === 2 ? '#f59e0b' : '#3b82f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  color: '#fff',
                }}>
                  {i + 1}
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: '#e5e7eb' }}>{s.name}</div>
                  <div style={{ fontSize: 10, color: '#94a3b8' }}>
                    Level {s.level} • {s.stars}⭐ • {s.date}
                  </div>
                </div>
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#fbbf24' }}>
                {s.score.toLocaleString()}
              </div>
            </div>
          ))}
          {filteredScores.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
              No scores yet. Be the first!
            </div>
          )}
        </div>

        {/* Save Score Button */}
        <div style={{ marginTop: 20, textAlign: 'center' }}>
          <button
            onClick={() => setShowNameInput(true)}
            style={{
              padding: '12px 30px',
              fontSize: 16,
              fontWeight: 700,
              background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              cursor: 'pointer',
            }}
          >
            Save Your Score
          </button>
        </div>
      </div>

      {/* Name Input Modal */}
      {showNameInput && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1001,
        }}>
          <div style={{
            width: 400,
            background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
            borderRadius: 20,
            padding: 30,
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#fbbf24', marginBottom: 20 }}>
              Save Your Score
            </div>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your name"
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 10,
                border: 'none',
                background: 'rgba(255,255,255,0.1)',
                color: '#fff',
                fontSize: 16,
                marginBottom: 15,
              }}
              autoFocus
            />
            <div style={{ fontSize: 14, color: '#94a3b8', marginBottom: 20 }}>
              Score: {lastScore.toLocaleString()} • Stars: {lastStars}
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button
                onClick={handleSaveScore}
                disabled={!playerName.trim()}
                style={{
                  padding: '10px 20px',
                  background: '#22c55e',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontWeight: 700,
                }}
              >
                Save
              </button>
              <button
                onClick={() => setShowNameInput(false)}
                style={{
                  padding: '10px 20px',
                  background: 'rgba(255,255,255,0.1)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
