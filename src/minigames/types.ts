export type MiniGameType = 
  | 'rhythm_match'
  | 'note_catch'
  | 'tempo_tap'
  | 'instrument_memory'
  | 'pitch_perfect'
  | 'conductor_says'
  | 'baton_precision';

export interface MiniGameResult {
  success: boolean;
  score: number;
  bonus: number;
}

export interface MiniGame {
  id: MiniGameType;
  name: string;
  description: string;
  duration: number; // seconds
  difficulty: number; // 1-5
  icon: string;
}

export const MINI_GAMES: MiniGame[] = [
  {
    id: 'rhythm_match',
    name: 'Rhythm Match',
    description: 'Copy the rhythm pattern!',
    duration: 8,
    difficulty: 2,
    icon: '🎵',
  },
  {
    id: 'note_catch',
    name: 'Note Catcher',
    description: 'Catch the falling notes!',
    duration: 10,
    difficulty: 3,
    icon: '🎶',
  },
  {
    id: 'tempo_tap',
    name: 'Tempo Tap',
    description: 'Tap on the beat!',
    duration: 6,
    difficulty: 1,
    icon: '👆',
  },
  {
    id: 'instrument_memory',
    name: 'Instrument Memory',
    description: 'Remember the sequence!',
    duration: 12,
    difficulty: 4,
    icon: '🎺',
  },
  {
    id: 'pitch_perfect',
    name: 'Pitch Perfect',
    description: 'Match the pitch!',
    duration: 8,
    difficulty: 3,
    icon: '🎤',
  },
  {
    id: 'conductor_says',
    name: 'Conductor Says',
    description: 'Follow the commands!',
    duration: 10,
    difficulty: 2,
    icon: '🎩',
  },
  {
    id: 'baton_precision',
    name: 'Baton Precision',
    description: 'Hit all targets!',
    duration: 10,
    difficulty: 3,
    icon: '🎯',
  },
];
