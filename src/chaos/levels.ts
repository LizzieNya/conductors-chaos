import { type OrchestraSection, type ChaosType } from '../store';
import { type ChaosEventDef } from './engine';

export type SongTheme = 'classic' | 'jazz' | 'electronic' | 'spooky' | 'epic' | 'folk';

export interface LevelDef {
  id: number;
  title: string;
  duration: number;
  songTheme: SongTheme;
  bandNames: Record<OrchestraSection, string>;
  description: string;
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

export function generateLevels(): LevelDef[] {
  const levels: LevelDef[] = [];
  
  const themes: SongTheme[] = ['classic', 'jazz', 'electronic', 'spooky', 'epic', 'folk'];

  for (let i = 1; i <= 30; i++) {
    let title = `Stage ${i}`;
    let duration = 60 + Math.floor(i * 1.5);
    let chaosCount = 4 + Math.floor(i * 0.8);
    let allowedChaos: ChaosType[] = ['wrong_notes'];

    if (i > 3) allowedChaos.push('tempo_rebellion');
    if (i > 10) allowedChaos.push('sleepy');
    if (i > 15) allowedChaos.push('hyperactive');
    if (i > 20) allowedChaos.push('out_of_sync');
    if (i > 25) allowedChaos.push('stage_fright');

    const theme = themes[i % themes.length];

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
    }

    if (i % 5 === 0) {
      title += ' (Boss Stage)';
      duration += 20;
      chaosCount += 5;
      // Boss stage - more chaos, harder to fix
      allowedChaos.push('hyperactive');
      allowedChaos.push('out_of_sync');
    }

    levels.push({
      id: i,
      title,
      duration,
      songTheme: theme,
      bandNames,
      description: `A ${theme} performance. Expect ${allowedChaos.join(', ')}.`,
      script: generateScript(duration, chaosCount, allowedChaos),
    });
  }
  
  return levels;
}

export const LEVELS = generateLevels();
