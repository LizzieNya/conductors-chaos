import { create } from 'zustand';

export interface Boss {
  id: number;
  name: string;
  description: string;
  health: number;
  maxHealth: number;
  attackPattern: string[];
  weakness: string;
  reward: number;
  icon: string;
}

export const BOSS_STAGES: Boss[] = [
  {
    id: 5,
    name: 'Maestro Malfunction',
    description: 'The orchestra is in chaos! Conduct with precision.',
    health: 100,
    maxHealth: 100,
    attackPattern: ['chaos_spread', 'speed_boost', 'multi_chaos'],
    weakness: 'precision',
    reward: 2500,
    icon: '🎭',
  },
  {
    id: 10,
    name: 'Maestro Malfunction',
    description: 'The orchestra is in chaos! Conduct with precision.',
    health: 150,
    maxHealth: 150,
    attackPattern: ['chaos_spread', 'speed_boost', 'multi_chaos', 'tempo_rebellion'],
    weakness: 'combo',
    reward: 3500,
    icon: '🎭',
  },
  {
    id: 15,
    name: 'Maestro Malfunction',
    description: 'The orchestra is in chaos! Conduct with precision.',
    health: 200,
    maxHealth: 200,
    attackPattern: ['chaos_spread', 'speed_boost', 'multi_chaos', 'tempo_rebellion', 'hyperactive'],
    weakness: 'shield',
    reward: 4500,
    icon: '🎭',
  },
  {
    id: 20,
    name: 'Maestro Malfunction',
    description: 'The orchestra is in chaos! Conduct with precision.',
    health: 250,
    maxHealth: 250,
    attackPattern: ['chaos_spread', 'speed_boost', 'multi_chaos', 'tempo_rebellion', 'hyperactive', 'out_of_sync'],
    weakness: 'all',
    reward: 5500,
    icon: '🎭',
  },
  {
    id: 25,
    name: 'Maestro Malfunction',
    description: 'The orchestra is in chaos! Conduct with precision.',
    health: 300,
    maxHealth: 300,
    attackPattern: ['chaos_spread', 'speed_boost', 'multi_chaos', 'tempo_rebellion', 'hyperactive', 'out_of_sync', 'stage_fright'],
    weakness: 'all',
    reward: 6500,
    icon: '🎭',
  },
  {
    id: 30,
    name: 'Maestro Malfunction',
    description: 'The orchestra is in chaos! Conduct with precision.',
    health: 400,
    maxHealth: 400,
    attackPattern: ['chaos_spread', 'speed_boost', 'multi_chaos', 'tempo_rebellion', 'hyperactive', 'out_of_sync', 'stage_fright', 'boss_special'],
    weakness: 'all',
    reward: 8000,
    icon: '🎭',
  },
];

interface BossState {
  activeBoss: Boss | null;
  bossHealth: number;
  bossPhase: number;
  bossAttackTimer: number;
  
  activateBoss: (boss: Boss) => void;
  damageBoss: (amount: number) => void;
  healBoss: (amount: number) => void;
  nextBossPhase: () => void;
  resetBoss: () => void;
  isBossDefeated: () => boolean;
}

export const useBossStore = create<BossState>((set, get) => ({
  activeBoss: null,
  bossHealth: 0,
  bossPhase: 1,
  bossAttackTimer: 0,

  activateBoss: (boss) => {
    set({
      activeBoss: boss,
      bossHealth: boss.maxHealth,
      bossPhase: 1,
      bossAttackTimer: 0,
    });
  },

  damageBoss: (amount) => {
    set((state) => {
      const newHealth = Math.max(0, state.bossHealth - amount);
      return { bossHealth: newHealth };
    });
  },

  healBoss: (amount) => {
    set((state) => {
      const boss = state.activeBoss;
      if (!boss) return {};
      const newHealth = Math.min(boss.maxHealth, state.bossHealth + amount);
      return { bossHealth: newHealth };
    });
  },

  nextBossPhase: () => {
    set((state) => {
      const newPhase = state.bossPhase + 1;
      return { bossPhase: newPhase };
    });
  },

  resetBoss: () => {
    set({
      activeBoss: null,
      bossHealth: 0,
      bossPhase: 1,
      bossAttackTimer: 0,
    });
  },

  isBossDefeated: () => {
    return get().bossHealth <= 0;
  },
}));
