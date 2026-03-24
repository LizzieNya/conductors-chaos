import React, { useState } from 'react';
import { useLeaderboardStore } from '../leaderboard';

interface Props {
  onClose: () => void;
  onClearData: () => void;
}

export const Settings: React.FC<Props> = ({ onClose, onClearData }) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const scores = useLeaderboardStore((s) => s.scores);
  const averageScore = useLeaderboardStore((s) => s.calculateAverage());

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
        width: 500,
        maxHeight: '90vh',
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
        borderRadius: 20,
        padding: 30,
        overflow: 'auto',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 32, fontWeight: 900, color: '#fbbf24' }}>
            ⚙️ Settings
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

        {/* Game Stats */}
        <div style={{
          background: 'rgba(0,0,0,0.2)',
          borderRadius: 12,
          padding: 20,
          marginBottom: 20,
        }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#e5e7eb', marginBottom: 15 }}>
            📊 Game Statistics
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: 15, borderRadius: 8 }}>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>Total Scores</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#fbbf24' }}>{scores.length}</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: 15, borderRadius: 8 }}>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>Average Score</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#fbbf24' }}>{averageScore.toLocaleString()}</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: 15, borderRadius: 8 }}>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>Best Score</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#fbbf24' }}>
                {scores.length > 0 ? scores[0].score.toLocaleString() : 'N/A'}
              </div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: 15, borderRadius: 8 }}>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>Top Score</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#fbbf24' }}>
                {scores.length > 0 ? scores[scores.length - 1].score.toLocaleString() : 'N/A'}
              </div>
            </div>
          </div>
        </div>

        {/* Audio Settings */}
        <div style={{
          background: 'rgba(0,0,0,0.2)',
          borderRadius: 12,
          padding: 20,
          marginBottom: 20,
        }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#e5e7eb', marginBottom: 15 }}>
            🔊 Audio
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ fontSize: 20 }}>🔊</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, color: '#e5e7eb' }}>Master Volume</div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>100%</div>
            </div>
            <div style={{ width: 100, height: 8, background: 'rgba(255,255,255,0.1)', borderRadius: 4 }}>
              <div style={{ width: '100%', height: '100%', background: '#8b5cf6', borderRadius: 4 }} />
            </div>
          </div>
        </div>

        {/* Controls Settings */}
        <div style={{
          background: 'rgba(0,0,0,0.2)',
          borderRadius: 12,
          padding: 20,
          marginBottom: 20,
        }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#e5e7eb', marginBottom: 15 }}>
            ⌨️ Controls
          </div>
          <div style={{ fontSize: 14, color: '#e5e7eb', marginBottom: 10 }}>
            Mouse/Touch: Move baton
          </div>
          <div style={{ fontSize: 14, color: '#e5e7eb' }}>
            Arrow Keys: Mini-game controls
          </div>
        </div>

        {/* Data Management */}
        <div style={{
          background: 'rgba(0,0,0,0.2)',
          borderRadius: 12,
          padding: 20,
        }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#e5e7eb', marginBottom: 15 }}>
            💾 Data Management
          </div>
          <button
            onClick={() => setShowConfirm(true)}
            style={{
              padding: '12px 24px',
              fontSize: 14,
              fontWeight: 700,
              background: 'rgba(239, 68, 68, 0.2)',
              color: '#ef4444',
              border: '1px solid rgba(239, 68, 68, 0.5)',
              borderRadius: 8,
              cursor: 'pointer',
            }}
          >
            🗑️ Reset All Data
          </button>
        </div>
      </div>

      {/* Confirm Reset Modal */}
      {showConfirm && (
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
            <div style={{ fontSize: 48, marginBottom: 15 }}>⚠️</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#fbbf24', marginBottom: 10 }}>
              Reset All Data?
            </div>
            <div style={{ fontSize: 14, color: '#94a3b8', marginBottom: 20 }}>
              This will delete all your progress, scores, and achievements. This action cannot be undone.
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button
                onClick={() => {
                  onClearData();
                  setShowConfirm(false);
                }}
                style={{
                  padding: '10px 20px',
                  background: '#ef4444',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontWeight: 700,
                }}
              >
                Yes, Reset
              </button>
              <button
                onClick={() => setShowConfirm(false)}
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
