import React, { useState, useEffect } from 'react';
import { useBossStore } from '../boss';
import { BOSS_STAGES } from '../boss';

interface Props {
  bossId: number;
  onBossDefeated: (reward: number) => void;
}

export const BossStage: React.FC<Props> = ({ bossId, onBossDefeated }) => {
  const boss = useBossStore((s) => s.activeBoss);
  const bossHealth = useBossStore((s) => s.bossHealth);
  const maxHealth = useBossStore((s) => s.activeBoss?.maxHealth || 100);
  const damageBoss = useBossStore((s) => s.damageBoss);
  const isDefeated = useBossStore((s) => s.isBossDefeated());

  const [bossName, setBossName] = useState('');
  const [bossDescription, setBossDescription] = useState('');
  const [bossIcon, setBossIcon] = useState('');

  useEffect(() => {
    // Set boss data
    const bossData = BOSS_STAGES.find(b => b.id === bossId);
    if (bossData) {
      setBossName(bossData.name);
      setBossDescription(bossData.description);
      setBossIcon(bossData.icon);
    }
  }, [bossId]);

  // Boss attack simulation
  useEffect(() => {
    if (!boss || isDefeated) return;

    const attackInterval = setInterval(() => {
      // Boss attacks - reduces harmony
      damageBoss(5);
    }, 2000);

    return () => clearInterval(attackInterval);
  }, [boss, isDefeated, damageBoss]);

  const handleBossHit = () => {
    if (boss && !isDefeated) {
      damageBoss(10);
    }
  };

  const healthPct = (bossHealth / maxHealth) * 100;

  if (isDefeated) {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}>
        <div style={{ textAlign: 'center', color: '#fff' }}>
          <div style={{ fontSize: 64, marginBottom: 20 }}>🎉</div>
          <div style={{ fontSize: 48, fontWeight: 900, color: '#fbbf24', marginBottom: 10 }}>
            BOSS DEFEATED!
          </div>
          <div style={{ fontSize: 24, marginBottom: 30 }}>
            Reward: {boss?.reward || 0} coins
          </div>
          <button
            onClick={() => onBossDefeated(boss?.reward || 0)}
            style={{
              padding: '15px 40px',
              fontSize: 20,
              fontWeight: 700,
              background: 'linear-gradient(135deg, #22c55e, #16a34a)',
              color: '#fff',
              border: 'none',
              borderRadius: 16,
              cursor: 'pointer',
            }}
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        width: 600,
        background: 'rgba(0,0,0,0.3)',
        borderRadius: 20,
        padding: 30,
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 48, marginBottom: 10 }}>{bossIcon}</div>
        <div style={{ fontSize: 32, fontWeight: 900, color: '#fbbf24', marginBottom: 5 }}>
          {bossName}
        </div>
        <div style={{ fontSize: 16, color: '#94a3b8', marginBottom: 20 }}>
          {bossDescription}
        </div>

        {/* Boss Health Bar */}
        <div style={{ marginBottom: 30 }}>
          <div style={{ fontSize: 14, color: '#e5e7eb', marginBottom: 5 }}>
            Boss Health: {bossHealth} / {maxHealth}
          </div>
          <div style={{
            width: '100%',
            height: 20,
            background: 'rgba(255,255,255,0.1)',
            borderRadius: 10,
            overflow: 'hidden',
          }}>
            <div style={{
              width: `${healthPct}%`,
              height: '100%',
              background: `linear-gradient(90deg, ${healthPct > 50 ? '#22c55e' : healthPct > 25 ? '#fbbf24' : '#ef4444'}, ${healthPct > 50 ? '#4ade80' : healthPct > 25 ? '#fde047' : '#f87171'})`,
              transition: 'width 0.3s',
            }} />
          </div>
        </div>

        {/* Boss Attack Pattern */}
        <div style={{
          display: 'flex',
          gap: 10,
          justifyContent: 'center',
          marginBottom: 30,
        }}>
          {boss?.attackPattern.map((pattern, i) => (
            <div
              key={i}
              style={{
                padding: '8px 16px',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: 8,
                fontSize: 12,
                color: '#94a3b8',
              }}
            >
              {pattern.replace('_', ' ')}
            </div>
          ))}
        </div>

        {/* Boss Hit Button */}
        <button
          onClick={handleBossHit}
          style={{
            padding: '20px 60px',
            fontSize: 24,
            fontWeight: 900,
            background: 'linear-gradient(135deg, #ef4444, #dc2626)',
            color: '#fff',
            border: 'none',
            borderRadius: 20,
            cursor: 'pointer',
            transition: 'transform 0.1s',
            boxShadow: '0 10px 30px rgba(239, 68, 68, 0.4)',
          }}
          onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
          onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          ⚡ HIT BOSS!
        </button>

        <div style={{ marginTop: 20, fontSize: 14, color: '#94a3b8' }}>
          Click to deal damage! Boss attacks every 2 seconds.
        </div>
      </div>
    </div>
  );
};
