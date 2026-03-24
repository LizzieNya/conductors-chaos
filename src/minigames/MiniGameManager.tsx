import React from 'react';
import { RhythmMatch } from './RhythmMatch';
import { TempoTap } from './TempoTap';
import { NoteCatch } from './NoteCatch';
import { ConductorSays } from './ConductorSays';
import { PitchPerfect } from './PitchPerfect';
import { BatonPrecision } from './BatonPrecision';
import { InstrumentMemory } from './InstrumentMemory';
import type { MiniGameType, MiniGameResult } from './types';

interface Props {
  gameType: MiniGameType;
  onComplete: (result: MiniGameResult) => void;
}

export const MiniGameManager: React.FC<Props> = ({ gameType, onComplete }) => {
  switch (gameType) {
    case 'rhythm_match':
      return <RhythmMatch onComplete={onComplete} />;
    case 'tempo_tap':
      return <TempoTap onComplete={onComplete} />;
    case 'note_catch':
      return <NoteCatch onComplete={onComplete} />;
    case 'conductor_says':
      return <ConductorSays onComplete={onComplete} />;
    case 'pitch_perfect':
      return <PitchPerfect onComplete={onComplete} />;
    case 'baton_precision':
      return <BatonPrecision onComplete={onComplete} />;
    case 'instrument_memory':
      return <InstrumentMemory onComplete={onComplete} />;
    default:
      // Fallback for unimplemented games
      return (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.95)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{ textAlign: 'center', color: '#fff' }}>
            <div style={{ fontSize: 48, marginBottom: 20 }}>🎮</div>
            <div style={{ fontSize: 24 }}>Mini-game coming soon!</div>
            <button
              onClick={() => onComplete({ success: true, score: 500, bonus: 0 })}
              style={{
                marginTop: 30,
                padding: '15px 30px',
                fontSize: 18,
                background: '#3b82f6',
                color: '#fff',
                border: 'none',
                borderRadius: 12,
                cursor: 'pointer',
              }}
            >
              Continue
            </button>
          </div>
        </div>
      );
  }
};
