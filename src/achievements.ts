import { create } from 'zustand';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress: number;
  maxProgress: number;
  hidden?: boolean;
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_fix',
    name: 'First Fix',
    description: 'Fix your first chaotic section',
    icon: '🎯',
    unlocked: false,
    progress: 0,
    maxProgress: 1,
  },
  {
    id: 'combo_master',
    name: 'Combo Master',
    description: 'Reach a 10x combo',
    icon: '🔥',
    unlocked: false,
    progress: 0,
    maxProgress: 10,
  },
  {
    id: 'perfect_harmony',
    name: 'Perfect Harmony',
    description: 'Complete a concert with 100% harmony',
    icon: '💯',
    unlocked: false,
    progress: 0,
    maxProgress: 1,
  },
  {
    id: 'speed_demon',
    name: 'Speed Demon',
    description: 'Fix 5 sections in under 10 seconds',
    icon: '⚡',
    unlocked: false,
    progress: 0,
    maxProgress: 5,
  },
  {
    id: 'five_star',
    name: 'Five Star Performance',
    description: 'Earn 5 stars on any level',
    icon: '⭐',
    unlocked: false,
    progress: 0,
    maxProgress: 1,
  },
  {
    id: 'millionaire',
    name: 'Millionaire Maestro',
    description: 'Earn 1,000,000 total score',
    icon: '💰',
    unlocked: false,
    progress: 0,
    maxProgress: 1000000,
  },
  {
    id: 'upgrade_collector',
    name: 'Upgrade Collector',
    description: 'Purchase 5 different upgrades',
    icon: '🛒',
    unlocked: false,
    progress: 0,
    maxProgress: 5,
  },
  {
    id: 'chaos_slayer',
    name: 'Chaos Slayer',
    description: 'Fix 100 chaotic sections',
    icon: '⚔️',
    unlocked: false,
    progress: 0,
    maxProgress: 100,
  },
  {
    id: 'no_spread',
    name: 'Containment Expert',
    description: 'Complete a concert without any chaos spreading',
    icon: '🛡️',
    unlocked: false,
    progress: 0,
    maxProgress: 1,
  },
  {
    id: 'power_collector',
    name: 'Power Collector',
    description: 'Collect 20 power-ups',
    icon: '✨',
    unlocked: false,
    progress: 0,
    maxProgress: 20,
  },
  {
    id: 'legendary_combo',
    name: 'Legendary Combo',
    description: 'Reach a 20x combo',
    icon: '🌟',
    unlocked: false,
    progress: 0,
    maxProgress: 20,
    hidden: true,
  },
  {
    id: 'hard_mode_master',
    name: 'Hard Mode Master',
    description: 'Complete 10 levels on Hard difficulty',
    icon: '💀',
    unlocked: false,
    progress: 0,
    maxProgress: 10,
  },
];

interface AchievementState {
  achievements: Record<string, Achievement>;
  newlyUnlocked: string[];
  
  checkAchievement: (id: string, progress?: number) => void;
  incrementAchievement: (id: string, amount?: number) => void;
  clearNewlyUnlocked: () => void;
  getUnlockedCount: () => number;
}

export const useAchievementStore = create<AchievementState>((set, get) => {
  // Load from localStorage
  const savedAchievements = localStorage.getItem('conductors-chaos-achievements');
  const initialAchievements: Record<string, Achievement> = {};
  
  for (const ach of ACHIEVEMENTS) {
    initialAchievements[ach.id] = { ...ach };
  }
  
  if (savedAchievements) {
    const saved = JSON.parse(savedAchievements);
    for (const id in saved) {
      if (initialAchievements[id]) {
        initialAchievements[id] = { ...initialAchievements[id], ...saved[id] };
      }
    }
  }
  
  return {
    achievements: initialAchievements,
    newlyUnlocked: [],

    checkAchievement: (id, progress) => {
      const state = get();
      const ach = state.achievements[id];
      if (!ach || ach.unlocked) return;

      const newProgress = progress !== undefined ? progress : ach.maxProgress;
      
      if (newProgress >= ach.maxProgress) {
        const updated = {
          ...ach,
          unlocked: true,
          progress: ach.maxProgress,
        };
        
        set({
          achievements: { ...state.achievements, [id]: updated },
          newlyUnlocked: [...state.newlyUnlocked, id],
        });
        
        localStorage.setItem(
          'conductors-chaos-achievements',
          JSON.stringify({ ...state.achievements, [id]: updated })
        );
      } else if (progress !== undefined) {
        const updated = { ...ach, progress };
        set({
          achievements: { ...state.achievements, [id]: updated },
        });
        
        localStorage.setItem(
          'conductors-chaos-achievements',
          JSON.stringify({ ...state.achievements, [id]: updated })
        );
      }
    },

    incrementAchievement: (id, amount = 1) => {
      const state = get();
      const ach = state.achievements[id];
      if (!ach || ach.unlocked) return;

      const newProgress = Math.min(ach.progress + amount, ach.maxProgress);
      state.checkAchievement(id, newProgress);
    },

    clearNewlyUnlocked: () => set({ newlyUnlocked: [] }),

    getUnlockedCount: () => {
      const state = get();
      return Object.values(state.achievements).filter((a) => a.unlocked).length;
    },
  };
});
