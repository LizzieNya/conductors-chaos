import { useGameStore, type OrchestraSection, type ChaosType } from '../store';
import { audioMixer } from '../audio/mixer';
import { useUpgradeStore } from '../upgrades';
import { useAchievementStore } from '../achievements';
import { MINI_GAMES } from '../minigames/types';

export type Difficulty = 'easy' | 'normal' | 'hard';

export interface ChaosEventDef {
  id: number;
  time: number;
  section: OrchestraSection;
  type: ChaosType;
  duration: number;
  triggered: boolean;
  fixed: boolean;
  spread: boolean;
}

import { LEVELS, type LevelDef } from './levels';

const SECTION_BOUNDS: Record<OrchestraSection, { x: number; y: number; w: number; h: number }> = {
  strings:    { x: 40,  y: 260, w: 200, h: 140 },
  woodwinds:  { x: 560, y: 260, w: 200, h: 140 },
  brass:      { x: 250, y: 130, w: 300, h: 120 },
  percussion: { x: 280, y: 30,  w: 240, h: 90  },
};

const ADJACENT: Record<OrchestraSection, OrchestraSection[]> = {
  strings:    ['brass', 'percussion'],
  woodwinds:  ['brass', 'percussion'],
  brass:      ['strings', 'woodwinds', 'percussion'],
  percussion: ['brass', 'strings', 'woodwinds'],
};

export class ChaosEngine {
  private startTime = 0;
  private tickTimer: number | null = null;
  private harmonyTimer: number | null = null;
  private scoreTimer: number | null = null;
  private events: ChaosEventDef[] = [];
  private fixAccumulator: Record<OrchestraSection, number> = {
    strings: 0, woodwinds: 0, brass: 0, percussion: 0,
  };
  private concertDuration = 90;
  private lastWhooshTime = 0;
  private difficulty: Difficulty = 'normal';
  public currentLevelDef: LevelDef | null = null;
  private timeDilationActive = false;
  private timeDilationEndTime = 0;
  private powerUpTimer: number | null = null;
  private miniGameTimer: number | null = null;

  setDifficulty(d: Difficulty) {
    this.difficulty = d;
  }

  getDifficulty() {
    return this.difficulty;
  }

  // Difficulty multipliers + upgrade effects
  private get fixSpeedMultiplier() {
    const difficultyMult = this.difficulty === 'easy' ? 1.5 : this.difficulty === 'hard' ? 0.7 : 1;
    const upgrades = useUpgradeStore.getState().getTotalEffect();
    return difficultyMult * (upgrades.fixSpeedMultiplier || 1);
  }
  private get chaosDurationMultiplier() {
    const difficultyMult = this.difficulty === 'easy' ? 1.4 : this.difficulty === 'hard' ? 0.7 : 1;
    const upgrades = useUpgradeStore.getState().getTotalEffect();
    return difficultyMult * (upgrades.chaosDurationMultiplier || 1);
  }

  getSectionBounds() {
    return SECTION_BOUNDS;
  }

  async start() {
    const store = useGameStore.getState();
    store.resetGame();

    // Apply starting combo upgrade
    const upgrades = useUpgradeStore.getState().getTotalEffect();
    if (upgrades.startingCombo && upgrades.startingCombo > 0) {
      for (let i = 0; i < upgrades.startingCombo; i++) {
        store.incrementCombo();
      }
    }

    const levelId = store.currentLevel;
    this.currentLevelDef = LEVELS.find((l) => l.id === levelId) || LEVELS[0];
    this.concertDuration = this.currentLevelDef.duration;

    // Deep clone events and apply difficulty scaling
    this.events = this.currentLevelDef.script.map((e) => ({
      ...e,
      duration: e.duration * this.chaosDurationMultiplier,
    }));
    this.fixAccumulator = { strings: 0, woodwinds: 0, brass: 0, percussion: 0 };

    await audioMixer.init(this.currentLevelDef.songTheme);
    audioMixer.start();

    store.setPhase('playing');
    this.startTime = Date.now();

    // Main game tick at 60fps
    this.tickTimer = window.setInterval(() => this.tick(), 16);

    // Harmony sampling every 500ms
    this.harmonyTimer = window.setInterval(() => {
      useGameStore.getState().updateHarmony();
    }, 500);

    // Score accumulation every second (boosted by harmony and combo)
    this.scoreTimer = window.setInterval(() => {
      const s = useGameStore.getState();
      if (s.phase === 'playing') {
        const comboMultiplier = 1 + (s.combo * 0.1);
        s.addScore(s.harmonyMeter * 0.5 * comboMultiplier);
      }
    }, 1000);

    // Power-up spawner (every 15-25 seconds)
    const spawnPowerUp = () => {
      const s = useGameStore.getState();
      if (s.phase === 'playing') {
        const types: Array<'speed' | 'shield' | 'freeze' | 'score'> = ['speed', 'shield', 'freeze', 'score'];
        const type = types[Math.floor(Math.random() * types.length)];
        const x = 100 + Math.random() * 600;
        const y = 50 + Math.random() * 350;
        s.spawnPowerUp(x, y, type);
      }
      this.powerUpTimer = window.setTimeout(spawnPowerUp, 15000 + Math.random() * 10000);
    };
    this.powerUpTimer = window.setTimeout(spawnPowerUp, 10000);

    // Mini-game spawner (every 20-30 seconds, 30% chance)
    const spawnMiniGame = () => {
      const s = useGameStore.getState();
      if (s.phase === 'playing' && Math.random() < 0.3) {
        const availableGames = MINI_GAMES.filter(g => g.difficulty <= 3);
        const game = availableGames[Math.floor(Math.random() * availableGames.length)];
        s.setActiveMiniGame(game.id);
      }
      this.miniGameTimer = window.setTimeout(spawnMiniGame, 20000 + Math.random() * 10000);
    };
    this.miniGameTimer = window.setTimeout(spawnMiniGame, 20000);

    // Perfect Pitch: Show warnings 2 seconds before chaos
    if (useUpgradeStore.getState().hasUpgrade('perfect_pitch')) {
      for (const evt of this.events) {
        if (evt.time > 2) {
          setTimeout(() => {
            const s = useGameStore.getState();
            if (s.phase === 'playing') {
              s.addChaosWarning(evt.section, evt.time, evt.type);
            }
          }, (evt.time - 2) * 1000);
        }
      }
    }
  }

  stop() {
    if (this.tickTimer !== null) {
      clearInterval(this.tickTimer);
      this.tickTimer = null;
    }
    if (this.harmonyTimer !== null) {
      clearInterval(this.harmonyTimer);
      this.harmonyTimer = null;
    }
    if (this.scoreTimer !== null) {
      clearInterval(this.scoreTimer);
      this.scoreTimer = null;
    }
    if (this.powerUpTimer !== null) {
      clearTimeout(this.powerUpTimer);
      this.powerUpTimer = null;
    }
    if (this.miniGameTimer !== null) {
      clearTimeout(this.miniGameTimer);
      this.miniGameTimer = null;
    }
    audioMixer.stop();
  }

  private tick() {
    const store = useGameStore.getState();
    if (store.phase !== 'playing') return;

    const elapsed = (Date.now() - this.startTime) / 1000;
    store.setConcertTime(elapsed);

    // Time Dilation: Activate when 3+ sections are chaotic
    const hasTimeDilation = useUpgradeStore.getState().hasUpgrade('time_dilation');
    if (hasTimeDilation) {
      const chaoticCount = Object.values(store.sections).filter(s => s.visual === 'chaotic').length;
      if (chaoticCount >= 3 && !this.timeDilationActive) {
        this.timeDilationActive = true;
        this.timeDilationEndTime = elapsed + 3; // 3 seconds of slow-mo
        store.setTimeDilation(0.5);
      }
      if (this.timeDilationActive && elapsed >= this.timeDilationEndTime) {
        this.timeDilationActive = false;
        store.setTimeDilation(1);
      }
    }

    // Concert ended
    if (elapsed >= this.concertDuration) {
      store.setPhase('results');
      this.stop();
      return;
    }

    // Check for new chaos events to trigger
    for (const evt of this.events) {
      if (!evt.triggered && elapsed >= evt.time) {
        this.triggerChaos(evt);
      }

      // Check for expired chaos (unfixed)
      if (evt.triggered && !evt.fixed && !evt.spread && elapsed >= evt.time + evt.duration) {
        this.spreadChaos(evt);
      }
    }

    // Baton fix detection
    this.detectFix();

    // Power-up collection detection
    this.detectPowerUpCollection();

    // Update active power-up duration
    if (store.activePowerUp) {
      const newDuration = store.activePowerUp.duration - 0.016;
      if (newDuration <= 0) {
        store.clearActivePowerUp();
      } else {
        store.setActivePowerUp(store.activePowerUp.type, newDuration);
      }
    }

    // Decay screen shake
    if (store.screenShake > 0) {
      store.setScreenShake(Math.max(0, store.screenShake - 0.5));
    }

    // Decay section shake
    const sectionKeys: OrchestraSection[] = ['strings', 'woodwinds', 'brass', 'percussion'];
    for (const key of sectionKeys) {
      if (store.sections[key].shakeAmount > 0) {
        store.setSectionShake(key, Math.max(0, store.sections[key].shakeAmount - 0.3));
      }
    }

    // Decay baton velocity to require constant wiggling to fix
    store.setBatonVelocity(store.batonVelocity * 0.9);
  }

  private triggerChaos(evt: ChaosEventDef) {
    evt.triggered = true;
    const store = useGameStore.getState();
    
    // Freeze power-up prevents new chaos
    if (store.activePowerUp?.type === 'freeze') {
      evt.fixed = true;
      return;
    }
    
    // Check for auto-fix upgrade
    const upgrades = useUpgradeStore.getState().getTotalEffect();
    if (upgrades.autoFixChance && Math.random() < upgrades.autoFixChance) {
      // Divine intervention! Auto-fix this chaos
      evt.fixed = true;
      store.addScore(100);
      audioMixer.playFixChime();
      return;
    }
    
    store.setSectionVisual(evt.section, 'chaotic');
    store.setSectionChaos(evt.section, 1, evt.type);
    store.setSectionShake(evt.section, 8);
    store.setAudienceReaction('gasp');
    audioMixer.setChaosLevel(evt.section, 1);
    audioMixer.playWarning();

    // Reset audience after 2s
    setTimeout(() => {
      const s = useGameStore.getState();
      if (s.audienceReaction === 'gasp') {
        s.setAudienceReaction('idle');
      }
    }, 2000);

    // Check if all sections chaotic — total meltdown
    const allChaotic = Object.values(store.sections).every(
      (s) => s.visual === 'chaotic'
    );
    if (allChaotic) {
      store.setScreenShake(20);
      store.setAudienceReaction('laugh');
    }
  }

  private spreadChaos(evt: ChaosEventDef) {
    evt.spread = true;
    const store = useGameStore.getState();
    store.addChaosMissed();
    store.resetCombo();

    // Shield power-up prevents spread
    if (store.activePowerUp?.type === 'shield') {
      return;
    }

    // Check chaos shield upgrade
    const upgrades = useUpgradeStore.getState().getTotalEffect();
    const spreadChance = upgrades.spreadChance || 1;
    if (Math.random() > spreadChance) {
      // Chaos shield blocked the spread!
      return;
    }

    // Find a normal adjacent section to spread to
    const adj = ADJACENT[evt.section];
    const normalAdj = adj.filter(
      (s) => store.sections[s].visual === 'normal' || store.sections[s].visual === 'fixed'
    );

    if (normalAdj.length > 0) {
      const target = normalAdj[Math.floor(Math.random() * normalAdj.length)];
      // Create a new spread event
      const spreadEvt: ChaosEventDef = {
        id: this.events.length + 100,
        time: (Date.now() - this.startTime) / 1000,
        section: target,
        type: evt.type,
        duration: evt.duration * 0.8,
        triggered: false,
        fixed: false,
        spread: false,
      };
      this.events.push(spreadEvt);
      audioMixer.playChaosSpread();
      store.setScreenShake(5);
      store.setAudienceReaction('laugh');
    }
  }

  private detectFix() {
    const store = useGameStore.getState();
    const { batonPosition, batonVelocity, activePowerUp } = store;

    // Whoosh sound on fast movement
    if (batonVelocity > 15 && Date.now() - this.lastWhooshTime > 200) {
      audioMixer.playWhoosh();
      this.lastWhooshTime = Date.now();
    }

    const sectionKeys: OrchestraSection[] = ['strings', 'woodwinds', 'brass', 'percussion'];

    for (const key of sectionKeys) {
      const bounds = SECTION_BOUNDS[key];
      const section = store.sections[key];

      // Is baton over this section?
      const inBounds =
        batonPosition.x >= bounds.x &&
        batonPosition.x <= bounds.x + bounds.w &&
        batonPosition.y >= bounds.y &&
        batonPosition.y <= bounds.y + bounds.h;

      if ((section.visual === 'chaotic' || section.visual === 'fixing') && inBounds && batonVelocity > 2.0) {
        // 2x fix speed when baton moves on beat
        const upgrades = useUpgradeStore.getState().getTotalEffect();
        const beatWindow = upgrades.beatWindowMultiplier || 1;
        const onBeat = audioMixer.isOnBeat(beatWindow);
        let progressAmount = (onBeat ? 0.04 : 0.02) * this.fixSpeedMultiplier;

        // Speed power-up doubles fix speed
        if (activePowerUp?.type === 'speed') {
          progressAmount *= 2;
        }

        this.fixAccumulator[key] += progressAmount;

        if (this.fixAccumulator[key] >= 1) {
          // FIXED!
          this.fixSection(key);
        } else {
          store.setSectionVisual(key, 'fixing');
          store.setSectionFixProgress(key, this.fixAccumulator[key]);
          // Partial audio crossfade
          audioMixer.setChaosLevel(key, 1 - this.fixAccumulator[key]);
        }
      } else if (section.visual === 'fixing' && (!inBounds || batonVelocity <= 2.0)) {
        // Lost focus — regress
        this.fixAccumulator[key] = Math.max(0, this.fixAccumulator[key] - 0.015);
        if (this.fixAccumulator[key] <= 0) {
          store.setSectionVisual(key, 'chaotic');
          audioMixer.setChaosLevel(key, 1);
        }
        store.setSectionFixProgress(key, this.fixAccumulator[key]);
      }
    }
  }

  private detectPowerUpCollection() {
    const store = useGameStore.getState();
    const { batonPosition, powerUps } = store;

    for (const powerUp of powerUps) {
      if (powerUp.collected) continue;

      const dx = batonPosition.x - powerUp.x;
      const dy = batonPosition.y - powerUp.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 30) {
        // Collected!
        store.collectPowerUp(powerUp.id);
        this.activatePowerUp(powerUp.type);
        audioMixer.playFixChime();
      }
    }
  }

  private activatePowerUp(type: 'speed' | 'shield' | 'freeze' | 'score') {
    const store = useGameStore.getState();
    const achStore = useAchievementStore.getState();
    
    achStore.incrementAchievement('power_collector');

    switch (type) {
      case 'speed':
        store.setActivePowerUp('speed', 8); // 8 seconds of 2x fix speed
        break;
      case 'shield':
        store.setActivePowerUp('shield', 10); // 10 seconds of immunity to spread
        // Instantly fix all chaotic sections
        const sectionKeys: OrchestraSection[] = ['strings', 'woodwinds', 'brass', 'percussion'];
        for (const key of sectionKeys) {
          if (store.sections[key].visual === 'chaotic' || store.sections[key].visual === 'fixing') {
            this.fixSection(key);
          }
        }
        break;
      case 'freeze':
        store.setActivePowerUp('freeze', 5); // 5 seconds of frozen chaos (no new events)
        break;
      case 'score':
        store.setActivePowerUp('score', 10); // 10 seconds of 2x score
        store.addScore(500); // Instant bonus
        break;
    }
  }

  private fixSection(section: OrchestraSection) {
    const store = useGameStore.getState();

    // Mark all active events for this section as fixed
    for (const evt of this.events) {
      if (evt.section === section && evt.triggered && !evt.fixed) {
        evt.fixed = true;
      }
    }

    store.setSectionVisual(section, 'fixed');
    store.setSectionChaos(section, 0, null);
    store.setSectionFixProgress(section, 0);
    store.addChaosFixed();
    store.incrementCombo();
    // Re-fetch after incrementing combo
    const newCombo = useGameStore.getState().combo;
    store.addScore(200 * newCombo);
    store.setAudienceReaction('applause');
    audioMixer.setChaosLevel(section, 0);
    audioMixer.playFixChime();

    this.fixAccumulator[section] = 0;

    // Check achievements
    const achStore = useAchievementStore.getState();
    achStore.checkAchievement('first_fix', 1);
    achStore.incrementAchievement('chaos_slayer');
    
    if (newCombo >= 10) {
      achStore.checkAchievement('combo_master', newCombo);
    }
    if (newCombo >= 20) {
      achStore.checkAchievement('legendary_combo', newCombo);
    }

    // Return to normal visual after brief "fixed" celebration
    setTimeout(() => {
      const s = useGameStore.getState();
      if (s.sections[section].visual === 'fixed') {
        s.setSectionVisual(section, 'normal');
      }
    }, 1500);

    setTimeout(() => {
      const s = useGameStore.getState();
      if (s.audienceReaction === 'applause') {
        s.setAudienceReaction('idle');
      }
    }, 2000);
  }
}

export const chaosEngine = new ChaosEngine();
