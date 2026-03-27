import { type OrchestraSection, type ChaosType } from '../store';
import { type ChaosEventDef } from './engine';

export type SongTheme = 
  | 'classic' 
  | 'jazz' 
  | 'electronic' 
  | 'spooky' 
  | 'epic' 
  | 'folk'
  | 'rock'
  | 'reggae'
  | 'latin'
  | 'country'
  | 'blues';

export interface LevelDef {
  id: number;
  title: string;
  duration: number;
  songTheme: SongTheme;
  bpm: number;
  bandNames: Record<OrchestraSection, string>;
  description: string;
  songName: string;
  artistName: string;
  script: ChaosEventDef[];
}

const SECTIONS: OrchestraSection[] = ['strings', 'woodwinds', 'brass', 'percussion'];

function generateScript(duration: number, chaosCount: number, allowedChaos: ChaosType[]): ChaosEventDef[] {
  const events: ChaosEventDef[] = [];
  let eventId = 1;
  const timeStep = duration / (chaosCount + 1);

  for (let i = 0; i < chaosCount; i++) {
    const time = Math.floor(timeStep * (i + 1) + (Math.random() * 4 - 2));
    const section = SECTIONS[Math.floor(Math.random() * SECTIONS.length)];
    const type = allowedChaos[Math.floor(Math.random() * allowedChaos.length)];
    const evtDuration = Math.floor(5 + Math.random() * 8);

    events.push({
      id: eventId++,
      time: Math.max(2, time),
      section,
      type,
      duration: evtDuration,
      triggered: false,
      fixed: false,
      spread: Math.random() > 0.7, // 30% chance to spread
    });
  }
  return events;
}

// Song names and artists for each theme
const SONG_DATA: Record<SongTheme, { songName: string; artistName: string; description: string }[]> = {
  classic: [
    { songName: 'Symphony No. 5', artistName: 'Beethoven', description: 'Dun dun dun dun!' },
    { songName: 'Four Seasons', artistName: 'Vivaldi', description: 'Springtime vibes' },
    { songName: 'Moonlight Sonata', artistName: 'Beethoven', description: 'Gentle and dreamy' },
  ],
  jazz: [
    { songName: 'Take Five', artistName: 'Dave Brubeck', description: 'Cool jazz vibes' },
    { songName: 'So What', artistName: 'Miles Davis', description: 'Modal jazz masterpiece' },
    { songName: 'Summertime', artistName: 'Ella Fitzgerald', description: 'Smooth and sultry' },
  ],
  electronic: [
    { songName: 'Strobe', artistName: 'Deadmau5', description: 'Progressive house epic' },
    { songName: 'Around the World', artistName: 'Daft Punk', description: 'Robo-funk classic' },
    { songName: 'Clarity', artistName: 'Zedd', description: 'Electropop anthem' },
  ],
  spooky: [
    { songName: 'Thriller', artistName: 'Michael Jackson', description: 'Monster mash time' },
    { songName: 'Nightmare', artistName: 'Danzig', description: 'Spooky and dark' },
    { songName: 'Ghostbusters', artistName: 'Ray Parker Jr.', description: 'Who you gonna call?' },
  ],
  epic: [
    { songName: 'Bohemian Rhapsody', artistName: 'Queen', description: 'Operatic rock masterpiece' },
    { songName: 'Eye of the Tiger', artistName: 'Survivor', description: 'Rock anthem' },
    { songName: 'Ode to Joy', artistName: 'Beethoven', description: 'Triumphant and uplifting' },
  ],
  folk: [
    { songName: 'Wagon Wheel', artistName: 'Darius Rucker', description: 'Folk-country classic' },
    { songName: 'The Times They Are A-Changin\'', artistName: 'Bob Dylan', description: 'Protest folk' },
    { songName: 'Home', artistName: 'Edward Sharpe', description: 'Folk-pop feel-good' },
  ],
  rock: [
    { songName: 'Smells Like Teen Spirit', artistName: 'Nirvana', description: 'Grunge anthem' },
    { songName: 'Bohemian Rhapsody', artistName: 'Queen', description: 'Rock opera' },
    { songName: 'Hotel California', artistName: 'Eagles', description: 'Classic rock masterpiece' },
  ],
  reggae: [
    { songName: 'One Love', artistName: 'Bob Marley', description: 'Peace and love' },
    { songName: 'Redemption Song', artistName: 'Bob Marley', description: 'Acoustic and powerful' },
    { songName: 'Is This Love', artistName: 'Bob Marley', description: 'Upbeat and joyful' },
  ],
  latin: [
    { songName: 'Livin\' La Vida Loca', artistName: 'Ricky Martin', description: 'Latin pop explosion' },
    { songName: 'Despacito', artistName: 'Luis Fonsi', description: 'Reggaeton hit' },
    { songName: 'Cantaloop', artistName: 'Flip & Fill', description: 'Jazz-funk classic' },
  ],
  country: [
    { songName: 'Jolene', artistName: 'Dolly Parton', description: 'Country classic' },
    { songName: 'Friends in Low Places', artistName: 'Garth Brooks', description: 'Barroom anthem' },
    { songName: 'Take Me Home, Country Roads', artistName: 'John Denver', description: 'Mountain melody' },
  ],
  blues: [
    { songName: 'The Thrill Is Gone', artistName: 'B.B. King', description: 'Soulful blues' },
    { songName: 'Cross Road Blues', artistName: 'Robert Johnson', description: 'Delta blues classic' },
    { songName: 'Pride and Joy', artistName: 'Stevie Ray Vaughan', description: 'Texas blues' },
  ],
};

export function generateLevels(): LevelDef[] {
  const levels: LevelDef[] = [];
  
  const themes: SongTheme[] = ['classic', 'jazz', 'electronic', 'spooky', 'epic', 'folk', 'rock', 'reggae', 'latin', 'country', 'blues'];

  for (let i = 1; i <= 30; i++) {
    let title = `Stage ${i}`;
    // Much shorter, more intense levels
    let duration = 30 + Math.floor(i * 0.5);
    let chaosCount = 4 + Math.floor(i * 0.8);
    let bpm = 120 + Math.floor(i * 0.5); // BPM increases with level
    let allowedChaos: ChaosType[] = ['wrong_notes'];

    if (i > 3) allowedChaos.push('tempo_rebellion');
    if (i > 10) allowedChaos.push('sleepy');
    if (i > 15) allowedChaos.push('hyperactive');
    if (i > 20) allowedChaos.push('out_of_sync');
    if (i > 25) allowedChaos.push('stage_fright');

    const theme = themes[i % themes.length];
    
    // Get random song for this theme
    const songData = SONG_DATA[theme][Math.floor(Math.random() * SONG_DATA[theme].length)];

    let bandNames: Record<OrchestraSection, string> = {
      strings: '🎻 Strings',
      woodwinds: '🎵 Woodwinds',
      brass: '🎺 Brass',
      percussion: '🥁 Percussion'
    };

    if (theme === 'jazz') {
      bandNames = { strings: '🎻 Upright Bass', woodwinds: '🎷 Saxophone', brass: '🎺 Trumpets', percussion: '🥁 Drum Kit' };
    } else if (theme === 'electronic') {
      bandNames = { strings: '🎹 Synth Pad', woodwinds: '🎹 Arp', brass: '🔊 Bass Drop', percussion: '🥁 Drum Machine' };
    } else if (theme === 'spooky') {
      bandNames = { strings: '🦇 Creepy Strings', woodwinds: '👻 Theremin', brass: '🕷️ Low Brass', percussion: '🦴 Bones' };
    } else if (theme === 'epic') {
      bandNames = { strings: '🎻 Huge Strings', woodwinds: '🎵 Flute Leads', brass: '🎺 Epic Horns', percussion: '🥁 Taiko Drums' };
    } else if (theme === 'folk') {
      bandNames = { strings: '🎻 Fiddle', woodwinds: '🎵 Flute', brass: '🎺 Accordion', percussion: '🥁 Tambourine' };
    } else if (theme === 'rock') {
      bandNames = { strings: '🎸 Electric Guitar', woodwinds: '🎤 Microphone', brass: '🎺 Trumpet Solos', percussion: '🥁 Drum Kit' };
    } else if (theme === 'reggae') {
      bandNames = { strings: '🎸 Reggae Guitar', woodwinds: '🎹 Organ', brass: '🎺 Horn Section', percussion: '🥁 Percussion' };
    } else if (theme === 'latin') {
      bandNames = { strings: '🎸 Cuatro', woodwinds: '🎹 Piano', brass: '🎺 Trombone', percussion: '🥁 Congas' };
    } else if (theme === 'country') {
      bandNames = { strings: '🎸 Acoustic Guitar', woodwinds: '🎻 Fiddle', brass: '🎺 Trumpet', percussion: '🥁 Banjo' };
    } else if (theme === 'blues') {
      bandNames = { strings: '🎸 Electric Guitar', woodwinds: '🎷 Harmonica', brass: '🎺 Trumpet', percussion: '🥁 Drums' };
    }

    if (i % 5 === 0) {
      title += ' (Boss Stage)';
      duration += 20;
      chaosCount += 5;
      bpm += 20;
      // Boss stage - more chaos, harder to fix
      allowedChaos.push('hyperactive');
      allowedChaos.push('out_of_sync');
    }

    levels.push({
      id: i,
      title,
      duration,
      songTheme: theme,
      bpm,
      bandNames,
      description: `A ${theme} performance. Expect ${allowedChaos.join(', ')}.`,
      songName: songData.songName,
      artistName: songData.artistName,
      script: generateScript(duration, chaosCount, allowedChaos),
    });
  }
  
  return levels;
}

export const LEVELS = generateLevels();
