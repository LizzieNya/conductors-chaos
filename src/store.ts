import { create } from 'zustand';
import { useUpgradeStore } from './upgrades';
import type { MiniGameType } from './minigames/types';

export type SectionVisual = 'normal' | 'chaotic' | 'fixing' | 'fixed';
export type OrchestraSection = 'strings' | 'woodwinds' | 'brass' | 'percussion';
export type GamePhase = 'menu' | 'loading' | 'playing' | 'paused' | 'results' | 'minigame';
export type ChaosType = 'wrong_notes' | 'tempo_rebellion' | 'sleepy' | 'hyperactive' | 'out_of_sync' | 'stage_fright';

export interface ChaosEvent {
  id: number;
  time: number;
  section: OrchestraSection;
  type: ChaosType;
  duration: number;
  triggered: boolean;
  fixed: boolean;
  spread: boolean;
}

export interface SectionInfo {
  visual: SectionVisual;
  chaosLevel: number; // 0-1 crossfade
  activeChaosType: ChaosType | null;
  fixProgress: number; // 0-1 how close to being fixed
  shakeAmount: number;
}

export interface ScoreData {
  totalScore: number;
  harmonyPct: number;
  chaosFixed: number;
  chaosMissed: number;
  stars: number; // 1-5
  maxCombo: number;
}

interface BatonTrail {
  x: number;
  y: number;
  t: number;
}

interface GameState {
  currentLevel: number;
  maxUnlockedLevel: number;
  phase: GamePhase;
  sections: Record<OrchestraSection, SectionInfo>;
  batonPosition: { x: number; y: number };
  batonVelocity: number;
  batonTrail: BatonTrail[];
  concertTime: number;
  concertDuration: number;
  harmonyMeter: number;
  score: number;
  combo: number;
  maxCombo: number;
  chaosFixed: number;
  chaosMissed: number;
  harmonySamples: number[];
  screenShake: number;
  audienceReaction: 'idle' | 'gasp' | 'laugh' | 'applause';
  timeDilation: number; // 1 = normal, 0.5 = slow-mo
  chaosWarnings: Array<{ section: OrchestraSection; time: number; type: ChaosType }>;
  powerUps: Array<{ id: number; x: number; y: number; type: 'speed' | 'shield' | 'freeze' | 'score'; collected: boolean }>;
  activePowerUp: { type: string; duration: number } | null;
  activeMiniGame: MiniGameType | null;
  miniGameScore: number;

  setCurrentLevel: (level: number) => void;
  unlockNextLevel: () => void;
  setPhase: (phase: GamePhase) => void;
  setBatonPosition: (x: number, y: number) => void;
  addBatonTrail: (x: number, y: number) => void;
  setBatonVelocity: (v: number) => void;
  setSectionVisual: (section: OrchestraSection, visual: SectionVisual) => void;
  setSectionChaos: (section: OrchestraSection, level: number, type: ChaosType | null) => void;
  setSectionFixProgress: (section: OrchestraSection, progress: number) => void;
  setSectionShake: (section: OrchestraSection, amount: number) => void;
  setConcertTime: (time: number) => void;
  updateHarmony: () => void;
  addScore: (amount: number) => void;
  incrementCombo: () => void;
  resetCombo: () => void;
  addChaosFixed: () => void;
  addChaosMissed: () => void;
  setScreenShake: (amount: number) => void;
  setAudienceReaction: (reaction: 'idle' | 'gasp' | 'laugh' | 'applause') => void;
  setTimeDilation: (amount: number) => void;
  addChaosWarning: (section: OrchestraSection, time: number, type: ChaosType) => void;
  clearChaosWarnings: () => void;
  spawnPowerUp: (x: number, y: number, type: 'speed' | 'shield' | 'freeze' | 'score') => void;
  collectPowerUp: (id: number) => void;
  setActivePowerUp: (type: string, duration: number) => void;
  clearActivePowerUp: () => void;
  setActiveMiniGame: (game: MiniGameType | null) => void;
  addMiniGameScore: (score: number) => void;
  getScoreData: () => ScoreData;
  resetGame: () => void;
}

const defaultSection = (): SectionInfo => ({
  visual: 'normal',
  chaosLevel: 0,
  activeChaosType: null,
  fixProgress: 0,
  shakeAmount: 0,
});

export const useGameStore = create<GameState>((set, get) => ({
  currentLevel: 1,
  maxUnlockedLevel: parseInt(localStorage.getItem('conductors-chaos-max-level') || '1', 10),
  phase: 'menu',
  sections: {
    strings: defaultSection(),
    woodwinds: defaultSection(),
    brass: defaultSection(),
    percussion: defaultSection(),
  },
  batonPosition: { x: 400, y: 300 },
  batonVelocity: 0,
  batonTrail: [],
  concertTime: 0,
  concertDuration: 90,
  harmonyMeter: 100,
  score: 0,
  combo: 0,
  maxCombo: 0,
  chaosFixed: 0,
  chaosMissed: 0,
  harmonySamples: [],
  screenShake: 0,
  audienceReaction: 'idle',
  timeDilation: 1,
  chaosWarnings: [],
  powerUps: [],
  activePowerUp: null,
  activeMiniGame: null,
  miniGameScore: 0,

  setCurrentLevel: (level) => set({ currentLevel: level }),
  unlockNextLevel: () =>
    set((s) => {
      const nextLevel = Math.max(s.maxUnlockedLevel, s.currentLevel + 1);
      if (nextLevel <= 30) {
        localStorage.setItem('conductors-chaos-max-level', String(nextLevel));
        return { maxUnlockedLevel: nextLevel };
      }
      return {};
    }),
  setPhase: (phase) => set({ phase }),
  setBatonPosition: (x, y) => set({ batonPosition: { x, y } }),
  addBatonTrail: (x, y) =>
    set((s) => {
      const trail = [...s.batonTrail, { x, y, t: Date.now() }];
      // Keep last 30 positions
      return { batonTrail: trail.slice(-30) };
    }),
  setBatonVelocity: (v) => set({ batonVelocity: v }),
  setSectionVisual: (section, visual) =>
    set((s) => ({
      sections: {
        ...s.sections,
        [section]: { ...s.sections[section], visual },
      },
    })),
  setSectionChaos: (section, level, type) =>
    set((s) => ({
      sections: {
        ...s.sections,
        [section]: { ...s.sections[section], chaosLevel: level, activeChaosType: type },
      },
    })),
  setSectionFixProgress: (section, progress) =>
    set((s) => ({
      sections: {
        ...s.sections,
        [section]: { ...s.sections[section], fixProgress: progress },
      },
    })),
  setSectionShake: (section, amount) =>
    set((s) => ({
      sections: {
        ...s.sections,
        [section]: { ...s.sections[section], shakeAmount: amount },
      },
    })),
  setConcertTime: (time) => set({ concertTime: time }),
  updateHarmony: () => {
    const state = get();
    const sectionKeys = Object.keys(state.sections) as OrchestraSection[];
    const normalCount = sectionKeys.filter(
      (k) => state.sections[k].visual === 'normal' || state.sections[k].visual === 'fixed'
    ).length;
    let harmony = (normalCount / sectionKeys.length) * 100;
    
    // Apply harmony decay multiplier from upgrades when sections are chaotic
    if (normalCount < sectionKeys.length) {
      const upgrades = useUpgradeStore.getState().getTotalEffect();
      const decayMult = upgrades.harmonyDecayMultiplier || 1;
      const currentHarmony = state.harmonyMeter;
      // Blend current with new based on decay multiplier
      harmony = currentHarmony + (harmony - currentHarmony) * (1 - decayMult * 0.5);
    }
    
    set((s) => ({
      harmonyMeter: harmony,
      harmonySamples: [...s.harmonySamples, harmony],
    }));
  },
  addScore: (amount) =>
    set((s) => {
      const upgrades = useUpgradeStore.getState().getTotalEffect();
      const comboMult = 1 + s.combo * 0.1;
      const upgradeMult = upgrades.comboScoreMultiplier || 1;
      return { score: s.score + amount * comboMult * upgradeMult };
    }),
  incrementCombo: () =>
    set((s) => ({
      combo: s.combo + 1,
      maxCombo: Math.max(s.maxCombo, s.combo + 1),
    })),
  resetCombo: () => set({ combo: 0 }),
  addChaosFixed: () => set((s) => ({ chaosFixed: s.chaosFixed + 1 })),
  addChaosMissed: () => set((s) => ({ chaosMissed: s.chaosMissed + 1 })),
  setScreenShake: (amount) => set({ screenShake: amount }),
  setAudienceReaction: (reaction) => set({ audienceReaction: reaction }),
  setTimeDilation: (amount) => set({ timeDilation: amount }),
  addChaosWarning: (section, time, type) =>
    set((s) => ({
      chaosWarnings: [...s.chaosWarnings, { section, time, type }],
    })),
  clearChaosWarnings: () => set({ chaosWarnings: [] }),
  spawnPowerUp: (x, y, type) =>
    set((s) => ({
      powerUps: [...s.powerUps, { id: Date.now(), x, y, type, collected: false }],
    })),
  collectPowerUp: (id) =>
    set((s) => ({
      powerUps: s.powerUps.map((p) => (p.id === id ? { ...p, collected: true } : p)),
    })),
  setActivePowerUp: (type, duration) => set({ activePowerUp: { type, duration } }),
  clearActivePowerUp: () => set({ activePowerUp: null }),
  setActiveMiniGame: (game) => set({ activeMiniGame: game, phase: game ? 'minigame' : 'playing' }),
  addMiniGameScore: (score) => set((s) => ({ miniGameScore: s.miniGameScore + score })),
  getScoreData: () => {
    const s = get();
    const avgHarmony =
      s.harmonySamples.length > 0
        ? s.harmonySamples.reduce((a, b) => a + b, 0) / s.harmonySamples.length
        : 100;
    const stars = Math.max(1, Math.min(5, Math.round(avgHarmony / 20)));
    return {
      totalScore: Math.round(s.score),
      harmonyPct: Math.round(avgHarmony),
      chaosFixed: s.chaosFixed,
      chaosMissed: s.chaosMissed,
      stars,
      maxCombo: s.maxCombo,
    };
  },
  resetGame: () =>
    set({
      phase: 'menu',
      sections: {
        strings: defaultSection(),
        woodwinds: defaultSection(),
        brass: defaultSection(),
        percussion: defaultSection(),
      },
      batonPosition: { x: 400, y: 300 },
      batonVelocity: 0,
      batonTrail: [],
      concertTime: 0,
      harmonyMeter: 100,
      score: 0,
      combo: 0,
      maxCombo: 0,
      chaosFixed: 0,
      chaosMissed: 0,
      harmonySamples: [],
      screenShake: 0,
      audienceReaction: 'idle',
      timeDilation: 1,
      chaosWarnings: [],
      powerUps: [],
      activePowerUp: null,
      activeMiniGame: null,
      miniGameScore: 0,
    }),
}));
