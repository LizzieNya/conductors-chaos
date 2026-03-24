import { create } from 'zustand';

export type UpgradeCategory = 'speed' | 'combo' | 'power' | 'special';

export interface Upgrade {
  id: string;
  name: string;
  description: string;
  category: UpgradeCategory;
  icon: string;
  maxLevel: number;
  baseCost: number;
  effect: (level: number) => UpgradeEffect;
}

export interface UpgradeEffect {
  fixSpeedMultiplier?: number;
  comboScoreMultiplier?: number;
  chaosDurationMultiplier?: number;
  spreadChance?: number;
  beatWindowMultiplier?: number;
  harmonyDecayMultiplier?: number;
  startingCombo?: number;
  autoFixChance?: number;
}

export const UPGRADES: Upgrade[] = [
  // SPEED CATEGORY
  {
    id: 'swift_baton',
    name: 'Swift Baton',
    description: 'Fix chaos faster with improved conducting technique',
    category: 'speed',
    icon: '⚡',
    maxLevel: 5,
    baseCost: 1500,
    effect: (level) => ({ fixSpeedMultiplier: 1 + level * 0.15 }),
  },
  {
    id: 'maestro_focus',
    name: 'Maestro Focus',
    description: 'Chaos takes longer to spread to other sections',
    category: 'speed',
    icon: '🎯',
    maxLevel: 5,
    baseCost: 2000,
    effect: (level) => ({ chaosDurationMultiplier: 1 + level * 0.2 }),
  },
  {
    id: 'rhythm_master',
    name: 'Rhythm Master',
    description: 'Larger window for on-beat bonuses',
    category: 'speed',
    icon: '🎵',
    maxLevel: 3,
    baseCost: 2500,
    effect: (level) => ({ beatWindowMultiplier: 1 + level * 0.3 }),
  },

  // COMBO CATEGORY
  {
    id: 'combo_keeper',
    name: 'Combo Keeper',
    description: 'Earn more points from combo multipliers',
    category: 'combo',
    icon: '🔥',
    maxLevel: 5,
    baseCost: 2000,
    effect: (level) => ({ comboScoreMultiplier: 1 + level * 0.2 }),
  },
  {
    id: 'warm_start',
    name: 'Warm Start',
    description: 'Begin each concert with a combo boost',
    category: 'combo',
    icon: '🌟',
    maxLevel: 3,
    baseCost: 3000,
    effect: (level) => ({ startingCombo: level * 2 }),
  },
  {
    id: 'harmony_sustain',
    name: 'Harmony Sustain',
    description: 'Harmony meter decays slower when sections are chaotic',
    category: 'combo',
    icon: '💫',
    maxLevel: 4,
    baseCost: 2500,
    effect: (level) => ({ harmonyDecayMultiplier: 1 - level * 0.15 }),
  },

  // POWER CATEGORY
  {
    id: 'chaos_shield',
    name: 'Chaos Shield',
    description: 'Reduce chance of chaos spreading to adjacent sections',
    category: 'power',
    icon: '🛡️',
    maxLevel: 5,
    baseCost: 3500,
    effect: (level) => ({ spreadChance: 1 - level * 0.15 }),
  },
  {
    id: 'divine_intervention',
    name: 'Divine Intervention',
    description: 'Small chance to auto-fix chaos when it appears',
    category: 'power',
    icon: '✨',
    maxLevel: 3,
    baseCost: 4000,
    effect: (level) => ({ autoFixChance: level * 0.08 }),
  },

  // SPECIAL CATEGORY
  {
    id: 'time_dilation',
    name: 'Time Dilation',
    description: 'Slow down time briefly when 3+ sections are chaotic',
    category: 'special',
    icon: '⏰',
    maxLevel: 1,
    baseCost: 5000,
    effect: () => ({}),
  },
  {
    id: 'perfect_pitch',
    name: 'Perfect Pitch',
    description: 'See chaos warnings 2 seconds before they trigger',
    category: 'special',
    icon: '👁️',
    maxLevel: 1,
    baseCost: 6000,
    effect: () => ({}),
  },
  {
    id: 'encore_bonus',
    name: 'Encore Bonus',
    description: 'Earn 50% more coins from perfect performances (4+ stars)',
    category: 'special',
    icon: '💰',
    maxLevel: 1,
    baseCost: 4500,
    effect: () => ({}),
  },
];

interface UpgradeState {
  coins: number;
  upgradeLevels: Record<string, number>;
  
  addCoins: (amount: number) => void;
  spendCoins: (amount: number) => boolean;
  purchaseUpgrade: (upgradeId: string) => boolean;
  getUpgradeLevel: (upgradeId: string) => number;
  getUpgradeCost: (upgradeId: string) => number;
  getTotalEffect: () => UpgradeEffect;
  hasUpgrade: (upgradeId: string) => boolean;
  resetCoins: () => void;
}

export const useUpgradeStore = create<UpgradeState>((set, get) => {
  // Load from localStorage
  const savedCoins = localStorage.getItem('conductors-chaos-coins');
  const savedUpgrades = localStorage.getItem('conductors-chaos-upgrades');
  
  return {
    coins: savedCoins ? parseInt(savedCoins, 10) : 0,
    upgradeLevels: savedUpgrades ? JSON.parse(savedUpgrades) : {},

    addCoins: (amount) => {
      set((state) => {
        const newCoins = state.coins + amount;
        localStorage.setItem('conductors-chaos-coins', String(newCoins));
        return { coins: newCoins };
      });
    },

    spendCoins: (amount) => {
      const state = get();
      if (state.coins >= amount) {
        set({ coins: state.coins - amount });
        localStorage.setItem('conductors-chaos-coins', String(state.coins - amount));
        return true;
      }
      return false;
    },

    purchaseUpgrade: (upgradeId) => {
      const state = get();
      const upgrade = UPGRADES.find((u) => u.id === upgradeId);
      if (!upgrade) return false;

      const currentLevel = state.upgradeLevels[upgradeId] || 0;
      if (currentLevel >= upgrade.maxLevel) return false;

      const cost = state.getUpgradeCost(upgradeId);
      if (!state.spendCoins(cost)) return false;

      const newLevels = {
        ...state.upgradeLevels,
        [upgradeId]: currentLevel + 1,
      };
      
      set({ upgradeLevels: newLevels });
      localStorage.setItem('conductors-chaos-upgrades', JSON.stringify(newLevels));
      return true;
    },

    getUpgradeLevel: (upgradeId) => {
      return get().upgradeLevels[upgradeId] || 0;
    },

    getUpgradeCost: (upgradeId) => {
      const upgrade = UPGRADES.find((u) => u.id === upgradeId);
      if (!upgrade) return 0;
      const currentLevel = get().upgradeLevels[upgradeId] || 0;
      if (currentLevel >= upgrade.maxLevel) return 0;
      // Exponential cost scaling
      return Math.floor(upgrade.baseCost * Math.pow(1.5, currentLevel));
    },

    getTotalEffect: () => {
      const state = get();
      const totalEffect: UpgradeEffect = {
        fixSpeedMultiplier: 1,
        comboScoreMultiplier: 1,
        chaosDurationMultiplier: 1,
        spreadChance: 1,
        beatWindowMultiplier: 1,
        harmonyDecayMultiplier: 1,
        startingCombo: 0,
        autoFixChance: 0,
      };

      for (const upgrade of UPGRADES) {
        const level = state.upgradeLevels[upgrade.id] || 0;
        if (level > 0) {
          const effect = upgrade.effect(level);
          
          if (effect.fixSpeedMultiplier) {
            totalEffect.fixSpeedMultiplier! *= effect.fixSpeedMultiplier;
          }
          if (effect.comboScoreMultiplier) {
            totalEffect.comboScoreMultiplier! *= effect.comboScoreMultiplier;
          }
          if (effect.chaosDurationMultiplier) {
            totalEffect.chaosDurationMultiplier! *= effect.chaosDurationMultiplier;
          }
          if (effect.spreadChance) {
            totalEffect.spreadChance! *= effect.spreadChance;
          }
          if (effect.beatWindowMultiplier) {
            totalEffect.beatWindowMultiplier! *= effect.beatWindowMultiplier;
          }
          if (effect.harmonyDecayMultiplier) {
            totalEffect.harmonyDecayMultiplier! *= effect.harmonyDecayMultiplier;
          }
          
          if (effect.startingCombo) {
            totalEffect.startingCombo! += effect.startingCombo;
          }
          if (effect.autoFixChance) {
            totalEffect.autoFixChance! += effect.autoFixChance;
          }
        }
      }

      return totalEffect;
    },

    hasUpgrade: (upgradeId) => {
      return (get().upgradeLevels[upgradeId] || 0) > 0;
    },

    resetCoins: () => {
      set({ coins: 0 });
      localStorage.removeItem('conductors-chaos-coins');
    },
  };
});
