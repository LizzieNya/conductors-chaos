import { create } from 'zustand';

export interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  date: string;
  stars: number;
  level: number;
}

export interface LeaderboardStats {
  totalScores: number;
  averageScore: number;
  bestScore: number;
  yourRank: number;
}

interface LeaderboardState {
  scores: LeaderboardEntry[];
  localHighScore: number;
  
  addScore: (name: string, score: number, stars: number, level: number) => void;
  getLeaderboard: () => LeaderboardEntry[];
  getTopScores: (count?: number) => LeaderboardEntry[];
  getYourRank: (score: number) => number;
  calculateAverage: () => number;
  clearScores: () => void;
}

export const useLeaderboardStore = create<LeaderboardState>((set, get) => {
  const savedScores = localStorage.getItem('conductors-chaos-leaderboard');
  const savedHighScore = localStorage.getItem('conductors-chaos-highscore');

  return {
    scores: savedScores ? JSON.parse(savedScores) : [],
    localHighScore: savedHighScore ? parseInt(savedHighScore, 10) : 0,

    addScore: (name, score, stars, level) => {
      const newEntry: LeaderboardEntry = {
        id: Date.now().toString(),
        name: name || 'Anonymous',
        score,
        date: new Date().toLocaleDateString(),
        stars,
        level,
      };

      set((state) => {
        const newScores = [...state.scores, newEntry]
          .sort((a, b) => b.score - a.score)
          .slice(0, 100); // Keep top 100

        localStorage.setItem('conductors-chaos-leaderboard', JSON.stringify(newScores));
        return { scores: newScores };
      });

      // Update high score
      if (score > get().localHighScore) {
        localStorage.setItem('conductors-chaos-highscore', String(score));
        set({ localHighScore: score });
      }
    },

    getLeaderboard: () => {
      return get().scores.sort((a, b) => b.score - a.score);
    },

    getTopScores: (count = 10) => {
      return get().scores.sort((a, b) => b.score - a.score).slice(0, count);
    },

    getYourRank: (score) => {
      const sorted = get().scores.sort((a, b) => b.score - a.score);
      return sorted.findIndex((s) => s.score >= score) + 1;
    },

    calculateAverage: () => {
      const scores = get().scores;
      if (scores.length === 0) return 0;
      const sum = scores.reduce((acc, s) => acc + s.score, 0);
      return Math.floor(sum / scores.length);
    },

    clearScores: () => {
      set({ scores: [] });
      localStorage.removeItem('conductors-chaos-leaderboard');
    },
  };
});
