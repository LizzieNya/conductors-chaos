# Conductor's Chaos 🎼

A frantic orchestra conducting game with WarioWare-style mini-games! Wave your baton to fix chaotic musicians, collect power-ups, complete daily challenges, and master quick mini-games for bonus points.

🎮 **[Play Now on GitHub Pages](https://YOUR_USERNAME.github.io/conductors-chaos/)**

## 🎯 Latest Features (v3.0)

### WarioWare-Style Mini-Games
Quick, frantic mini-games that appear during concerts:
- **🎵 Rhythm Match**: Copy the rhythm pattern (8s)
- **🎶 Note Catcher**: Catch falling notes with your basket (10s)
- **👆 Tempo Tap**: Tap on the beat for perfect timing (6s)
- **🎩 Conductor Says**: Simon Says with conducting commands (10s)
- More mini-games coming soon!

Mini-games award bonus score and XP when completed successfully!

### Complete Gamification System
- **Level & XP System**: Earn XP from performances, level up to unlock titles
- **Player Titles**: Progress from "Novice Conductor" to "Immortal Maestro"
- **Daily Challenges**: New challenge every day with coin rewards
- **Streak System**: Build daily play streaks for bonuses
- **Player Stats**: Track total plays, perfect concerts, and more

### Enhanced Progression
- **XP Rewards**: Earn XP based on score and performance
- **Level-Based Titles**: 7 unique titles to unlock
- **Challenge Variety**: 6 different daily challenge types
- **Stat Tracking**: Comprehensive statistics system

## 🎮 Core Features

### Power-Up System
- **⚡ Speed Boost**: 2x fix speed for 8 seconds
- **🛡️ Shield**: Instant fix all chaos + spread immunity
- **❄️ Freeze**: Prevents new chaos for 5 seconds
- **💰 Score Multiplier**: +500 bonus + 2x score

### Chaos Types (6 Total)
- Wrong Notes, Tempo Rebellion, Sleepy, Hyperactive
- Out of Sync (Level 21+), Stage Fright (Level 26+)

### Upgrade System
- 11 unique upgrades across 4 categories
- Persistent coin economy
- Special abilities (Time Dilation, Perfect Pitch)

### Achievement System
- 12 achievements to unlock
- Progress tracking across sessions
- Hidden achievements for discovery

## 🎯 How to Play

1. **Wave Your Baton**: Move your mouse/finger over troubled sections
2. **Fix Chaos**: Keep moving over red sections to calm them down
3. **Stay On Beat**: Move on the beat for 2x fix speed
4. **Collect Power-Ups**: Grab floating power-ups for temporary boosts
5. **Complete Mini-Games**: Quick challenges for bonus score
6. **Daily Challenges**: Complete daily objectives for rewards
7. **Build Streaks**: Play daily to maintain your streak
8. **Level Up**: Earn XP to unlock new titles

## 🚀 Quick Start

### Play Online
Visit the [GitHub Pages deployment](https://YOUR_USERNAME.github.io/conductors-chaos/)

### Run Locally
```bash
npm install
npm run dev
```

### Build for Production
```bash
npm run build
```

## 📦 Deployment

The game automatically deploys to GitHub Pages when you push to `main`. See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

### Quick Deploy
```bash
git init
git add .
git commit -m "Deploy Conductor's Chaos"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/conductors-chaos.git
git push -u origin main
```

Then enable GitHub Pages in your repository settings (Settings → Pages → Source: GitHub Actions).

## 🎨 Game Modes

- **Easy**: 1.5x fix speed, 0.75x coins
- **Normal**: Balanced gameplay
- **Hard**: 0.7x fix speed, 1.5x coins

## 🏆 Progression System

### Leveling
- Earn XP from concerts (score/10 + stars × 100)
- Mini-game bonuses (50-100 XP)
- 1000 XP per level
- 7 unique titles to unlock

### Daily Challenges
- New challenge every day
- 6 challenge types (score, combo, fixes, harmony, stars, power-ups)
- Rewards scale with player level
- 500+ coin rewards

### Streaks
- Build daily play streaks
- Track longest streak
- Bonus motivation for consistent play

## 🛠️ Tech Stack

- React 18 + TypeScript
- Vite for build tooling
- Zustand for state management
- Web Audio API for synthesized music
- Canvas API for rendering
- GitHub Actions for CI/CD

## 📊 Bundle Size

- Total: ~289KB (86KB gzipped)
- Optimized with code splitting and tree shaking
- Fast load times on all connections

## 🎵 Features Breakdown

### Mini-Games (4 Implemented)
- Rhythm Match: Memory-based pattern matching
- Note Catcher: Reaction-based catching game
- Tempo Tap: Rhythm timing challenge
- Conductor Says: Simon Says variant

### Gamification
- XP and leveling system
- Daily challenges with 6 types
- Streak tracking
- Comprehensive stats
- Player titles

### Power-Ups (4 Types)
- Speed, Shield, Freeze, Score
- Dynamic spawning
- Visual effects

### Upgrades (11 Total)
- Speed, Combo, Power, Special categories
- Persistent progression
- Exponential cost scaling

### Achievements (12 Total)
- Progress and skill-based
- Hidden achievements
- Persistent tracking

## 🎮 Controls

- **Mouse/Touch**: Move baton
- **Arrow Keys**: Mini-game controls
- **Spacebar**: Mini-game actions
- **ESC**: Pause game

## 📝 License

MIT License - Feel free to use and modify!

## 🤝 Contributing

Contributions welcome! Feel free to:
- Add new mini-games
- Create new chaos types
- Design new power-ups
- Improve visual effects
- Optimize performance

## 🎯 Roadmap

- [ ] More mini-games (6+ total)
- [ ] Online leaderboards
- [ ] Multiplayer mode
- [ ] Custom baton skins
- [ ] Stage themes
- [ ] Mobile app version
- [ ] Sound effect improvements
- [ ] Accessibility features

---

Made with ❤️ for music and gaming enthusiasts!

### Power-Up System
- **Dynamic Power-Ups**: Collect floating power-ups during concerts
  - ⚡ **Speed Boost**: 2x fix speed for 8 seconds
  - 🛡️ **Shield**: Instant fix all chaos + spread immunity
  - ❄️ **Freeze**: Prevents new chaos for 5 seconds
  - 💰 **Score Multiplier**: +500 bonus + 2x score
- Power-ups spawn every 15-25 seconds
- Collect by moving your baton over them

### New Chaos Types
- **Out of Sync** (Level 21+): Musicians play with delayed timing
- **Stage Fright** (Level 26+): Musicians tremble nervously
- Total of 6 unique chaos behaviors

### Implemented Special Upgrades
- **Time Dilation**: Automatically slows time when 3+ sections are chaotic
- **Perfect Pitch**: Shows warning indicators 2 seconds before chaos triggers
- Both upgrades now fully functional!

### Achievement System
- **12 Achievements** to unlock
- Track progress across sessions
- Mix of skill-based and progress-based goals
- Hidden achievements for discovery

## Core Features

### Upgrade System
- **Persistent Progression**: Earn coins from performances and spend them on permanent upgrades
- **11 Unique Upgrades** across 4 categories:
  - **Speed**: Fix chaos faster, extend chaos duration, improve beat timing
  - **Combo**: Boost combo multipliers, start with combo bonuses, sustain harmony longer
  - **Power**: Shield against chaos spread, divine auto-fix intervention
  - **Special**: Time dilation, perfect pitch warnings, encore coin bonuses

### Coin Economy
- Earn coins based on your score and star rating
- Bonus coins for 4+ star performances with the Encore Bonus upgrade
- Difficulty multipliers: Hard mode gives 1.5x coins, Easy mode gives 0.75x coins
- Coins persist across sessions

### Enhanced Gameplay
- Upgrades directly affect gameplay mechanics
- Visual indicators show active upgrades during concerts
- Starting combo boost for quick momentum
- Reduced chaos spread with shield upgrades
- Auto-fix divine intervention for lucky saves

## How to Play

1. **Wave Your Baton**: Move your mouse/finger over troubled sections
2. **Fix Chaos**: Keep moving over red sections to calm them down
3. **Stay On Beat**: Move on the beat (watch the baton pulse) for 2x fix speed
4. **Collect Power-Ups**: Grab floating power-ups for temporary boosts
5. **Prevent Spread**: Fix chaos before it spreads to adjacent sections
6. **Build Combos**: Chain fixes together for massive score multipliers
7. **Earn Coins**: Complete concerts to earn coins for upgrades
8. **Upgrade**: Visit the shop to permanently enhance your conducting abilities
9. **Unlock Achievements**: Complete challenges for bragging rights

## Upgrade Strategy Tips

- **Early Game**: Focus on Swift Baton and Chaos Shield for easier chaos management
- **Mid Game**: Invest in Combo Keeper and Warm Start for higher scores
- **Late Game**: Unlock special abilities like Divine Intervention and Perfect Pitch
- **Hard Mode Players**: Prioritize defensive upgrades (Chaos Shield, Harmony Sustain)
- **Score Chasers**: Max out combo upgrades and get Encore Bonus for maximum coins
- **Power-Up Synergy**: Speed Boost + Swift Baton = ultra-fast fixes
- **Strategic Planning**: Perfect Pitch lets you prepare for incoming chaos

## Development

Built with React, TypeScript, Vite, and Zustand for state management.

```bash
npm install
npm run dev
```

Enjoy conducting! 🎭
