import { create } from 'zustand';

export interface DailyChallenge {
  id: string;
  date: string;
  description: string;
  requirement: number;
  progress: number;
  reward: number;
  completed: boolean;
  icon: string;
}

export interface PlayerStats {
  totalPlays: number;
  totalScore: number;
  perfectConcerts: number;
  currentStreak: number;
  longestStreak: number;
  lastPlayDate: string;
  level: number;
  xp: number;
  title: string;
}

interface GamificationState {
  stats: PlayerStats;
  dailyChallenge: DailyChallenge | null;
  streak: number;
  
  addXP: (amount: number) => void;
  incrementStat: (stat: keyof PlayerStats, amount?: number) => void;
  updateStreak: () => void;
  generateDailyChallenge: () => void;
  updateChallengeProgress: (progress: number) => void;
  getPlayerTitle: () => string;
}

const TITLES = [
  { level: 1, title: 'Novice Conductor' },
  { level: 5, title: 'Apprentice Maestro' },
  { level: 10, title: 'Skilled Conductor' },
  { level: 15, title: 'Master Conductor' },
  { level: 20, title: 'Virtuoso Maestro' },
  { level: 30, title: 'Legendary Conductor' },
  { level: 50, title: 'Immortal Maestro' },
];

const CHALLENGE_TEMPLATES = [
  { id: 'score', desc: 'Score {req} points in a single concert', icon: '🎯', baseReq: 5000 },
  { id: 'combo', desc: 'Reach a {req}x combo', icon: '🔥', baseReq: 10 },
  { id: 'fixes', desc: 'Fix {req} chaotic sections', icon: '⚡', baseReq: 15 },
  { id: 'harmony', desc: 'Maintain {req}% average harmony', icon: '💫', baseReq: 80 },
  { id: 'stars', desc: 'Earn {req} stars total today', icon: '⭐', baseReq: 15 },
  { id: 'powerups', desc: 'Collect {req} power-ups', icon: '✨', baseReq: 5 },
];

export const useGamificationStore = create<GamificationState>((set, get) => {
  const savedStats = localStorage.getItem('conductors-chaos-stats');
  const savedChallenge = localStorage.getItem('conductors-chaos-daily-challenge');
  
  const defaultStats: PlayerStats = {
    totalPlays: 0,
    totalScore: 0,
    perfectConcerts: 0,
    currentStreak: 0,
    longestStreak: 0,
    lastPlayDate: '',
    level: 1,
    xp: 0,
    title: 'Novice Conductor',
  };

  return {
    stats: savedStats ? JSON.parse(savedStats) : defaultStats,
    dailyChallenge: savedChallenge ? JSON.parse(savedChallenge) : null,
    streak: 0,

    addXP: (amount) => {
      set((state) => {
        const newXP = state.stats.xp + amount;
        const xpPerLevel = 1000;
        const newLevel = Math.floor(newXP / xpPerLevel) + 1;
        
        const title = TITLES.reduce((acc, t) => 
          newLevel >= t.level ? t.title : acc, 
          'Novice Conductor'
        );

        const newStats = {
          ...state.stats,
          xp: newXP,
          level: newLevel,
          title,
        };

        localStorage.setItem('conductors-chaos-stats', JSON.stringify(newStats));
        return { stats: newStats };
      });
    },

    incrementStat: (stat, amount = 1) => {
      set((state) => {
        const newStats = {
          ...state.stats,
          [stat]: (state.stats[stat] as number) + amount,
        };
        localStorage.setItem('conductors-chaos-stats', JSON.stringify(newStats));
        return { stats: newStats };
      });
    },

    updateStreak: () => {
      set((state) => {
        const today = new Date().toDateString();
        const lastPlay = state.stats.lastPlayDate;
        
        let newStreak = state.stats.currentStreak;
        
        if (lastPlay !== today) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          
          if (lastPlay === yesterday.toDateString()) {
            newStreak++;
          } else if (lastPlay !== '') {
            newStreak = 1;
          } else {
            newStreak = 1;
          }
        }

        const newStats = {
          ...state.stats,
          currentStreak: newStreak,
          longestStreak: Math.max(newStreak, state.stats.longestStreak),
          lastPlayDate: today,
        };

        localStorage.setItem('conductors-chaos-stats', JSON.stringify(newStats));
        return { stats: newStats };
      });
    },

    generateDailyChallenge: () => {
      const today = new Date().toDateString();
      const current = get().dailyChallenge;
      
      if (current && current.date === today) return;

      const template = CHALLENGE_TEMPLATES[Math.floor(Math.random() * CHALLENGE_TEMPLATES.length)];
      const multiplier = 1 + Math.floor(get().stats.level / 5) * 0.5;
      const requirement = Math.floor(template.baseReq * multiplier);

      const challenge: DailyChallenge = {
        id: template.id,
        date: today,
        description: template.desc.replace('{req}', requirement.toString()),
        requirement,
        progress: 0,
        reward: 500 + get().stats.level * 50,
        completed: false,
        icon: template.icon,
      };

      set({ dailyChallenge: challenge });
      localStorage.setItem('conductors-chaos-daily-challenge', JSON.stringify(challenge));
    },

    updateChallengeProgress: (progress) => {
      set((state) => {
        if (!state.dailyChallenge || state.dailyChallenge.completed) return {};

        const newChallenge = {
          ...state.dailyChallenge,
          progress: Math.max(state.dailyChallenge.progress, progress),
          completed: progress >= state.dailyChallenge.requirement,
        };

        localStorage.setItem('conductors-chaos-daily-challenge', JSON.stringify(newChallenge));
        return { dailyChallenge: newChallenge };
      });
    },

    getPlayerTitle: () => {
      return get().stats.title;
    },
  };
});
