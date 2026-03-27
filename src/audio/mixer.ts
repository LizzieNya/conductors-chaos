import { useGameStore, type OrchestraSection } from '../store';

// Synthesized audio using Web Audio API oscillators
// Each section has a "correct" set of notes and a "chaotic" set

interface SectionAudio {
  correctOsc: OscillatorNode | null;
  chaoticOsc: OscillatorNode | null;
  correctGain: GainNode;
  chaoticGain: GainNode;
  merger: GainNode;
}

// Musical notes for each section (frequencies in Hz) — C major scale
const SECTION_NOTES: Record<OrchestraSection, { correct: number[]; chaotic: number[] }> = {
  strings: {
    correct: [261.63, 293.66, 329.63, 349.23, 392.0, 440.0, 493.88, 523.25],
    chaotic: [277.18, 311.13, 369.99, 415.30, 466.16, 554.37, 622.25, 739.99],
  },
  woodwinds: {
    correct: [523.25, 587.33, 659.25, 698.46, 783.99, 880.0, 987.77, 1046.5],
    chaotic: [554.37, 622.25, 739.99, 830.61, 932.33, 1108.73, 1244.51, 1479.98],
  },
  brass: {
    correct: [130.81, 146.83, 164.81, 174.61, 196.0, 220.0, 246.94, 261.63],
    chaotic: [138.59, 155.56, 185.0, 207.65, 233.08, 277.18, 311.13, 369.99],
  },
  percussion: {
    // 1=Kick, 2=Snare, 3=HiHat
    correct: [1, 3, 2, 3, 1, 3, 2, 3],
    chaotic: [2, 1, 1, 2, 3, 3, 2, 1],
  },
};

const OSCILLATOR_TYPES: Record<OrchestraSection, OscillatorType> = {
  strings: 'sawtooth',
  woodwinds: 'sine',
  brass: 'square',
  percussion: 'triangle',
};

// Song-specific BPM ranges
const SONG_BPM_RANGES: Record<string, { min: number; max: number }> = {
  classic: { min: 80, max: 120 },
  jazz: { min: 100, max: 160 },
  electronic: { min: 120, max: 140 },
  spooky: { min: 60, max: 90 },
  epic: { min: 100, max: 130 },
  folk: { min: 90, max: 120 },
  rock: { min: 120, max: 150 },
  reggae: { min: 80, max: 100 },
  latin: { min: 110, max: 140 },
  country: { min: 90, max: 120 },
  blues: { min: 70, max: 100 },
};

export class AudioMixer {
  private ctx: AudioContext | null = null;
  private sections: Partial<Record<OrchestraSection, SectionAudio>> = {};
  private masterGain: GainNode | null = null;
  private isPlaying = false;
  private noteTimers: number[] = [];
  private currentNoteIndex: Record<OrchestraSection, number> = {
    strings: 0,
    woodwinds: 0,
    brass: 0,
    percussion: 0,
  };
  private bpm = 120;
  private beatInterval = 500; // ms
  private schedulerTimer: number | null = null;
  private beatStartTime = 0; // performance.now() when scheduler started
  private currentTheme: string = 'classic';
  private currentSongName: string = '';
  private currentArtistName: string = '';

  async init(theme: string = 'classic', songName: string = '', artistName: string = '') {
    this.currentTheme = theme;
    this.currentSongName = songName;
    this.currentArtistName = artistName;
    
    // Adjust BPM based on theme
    const bpmRange = SONG_BPM_RANGES[theme] || { min: 100, max: 140 };
    this.bpm = Math.floor((bpmRange.min + bpmRange.max) / 2) + Math.floor(Math.random() * 10);
    
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.3;
    this.masterGain.connect(this.ctx.destination);

    // Create gain nodes for each section
    const sectionKeys: OrchestraSection[] = ['strings', 'woodwinds', 'brass', 'percussion'];
    for (const key of sectionKeys) {
      const correctGain = this.ctx.createGain();
      correctGain.gain.value = 1.0;

      const chaoticGain = this.ctx.createGain();
      chaoticGain.gain.value = 0.0;

      const merger = this.ctx.createGain();
      merger.gain.value = 0.25; // Each section at 25%

      correctGain.connect(merger);
      chaoticGain.connect(merger);
      merger.connect(this.masterGain);

      this.sections[key] = {
        correctOsc: null,
        chaoticOsc: null,
        correctGain,
        chaoticGain,
        merger,
      };
    }
  }

  getCurrentSongInfo(): { songName: string; artistName: string; bpm: number } {
    return {
      songName: this.currentSongName,
      artistName: this.currentArtistName,
      bpm: this.bpm,
    };
  }

  private playNote(section: OrchestraSection, isChaotic: boolean) {
    if (!this.ctx || !this.sections[section]) return;

    const chaosType = useGameStore.getState().sections[section]?.activeChaosType;
    const sectionAudio = this.sections[section]!;
    const notes = isChaotic
      ? SECTION_NOTES[section].chaotic
      : SECTION_NOTES[section].correct;

    const noteIdx = this.currentNoteIndex[section] % notes.length;
    const freq = notes[noteIdx];

    // Custom Percussion Synthesizer
    if (section === 'percussion') {
      const type = freq; // 1=Kick, 2=Snare, 3=HiHat

      if (type === 1) { // Kick
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);

        const envelope = this.ctx.createGain();
        envelope.gain.setValueAtTime(1, this.ctx.currentTime);
        envelope.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);

        osc.connect(envelope);
        envelope.connect(isChaotic ? sectionAudio.chaoticGain : sectionAudio.correctGain);
        osc.start(); osc.stop(this.ctx.currentTime + 0.5);
      } else if (type === 2) { // Snare (White Noise + Tone)
        const bufferSize = this.ctx.sampleRate * 0.2; // 200ms
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const noiseFilter = this.ctx.createBiquadFilter();
        noiseFilter.type = 'highpass';
        noiseFilter.frequency.value = 1000;

        const envelope = this.ctx.createGain();
        envelope.gain.setValueAtTime(isChaotic ? 1.5 : 0.8, this.ctx.currentTime);
        envelope.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);

        noise.connect(noiseFilter);
        noiseFilter.connect(envelope);
        envelope.connect(isChaotic ? sectionAudio.chaoticGain : sectionAudio.correctGain);
        noise.start();
      } else if (type === 3) { // HiHat
        const bufferSize = this.ctx.sampleRate * 0.05;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const noiseFilter = this.ctx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.value = 8000;

        const envelope = this.ctx.createGain();
        envelope.gain.setValueAtTime(isChaotic ? 0.8 : 0.4, this.ctx.currentTime);
        envelope.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);

        noise.connect(noiseFilter);
        noiseFilter.connect(envelope);
        envelope.connect(isChaotic ? sectionAudio.chaoticGain : sectionAudio.correctGain);
        noise.start();
      }
      return;
    }

    // Melodic Instruments
    let type = OSCILLATOR_TYPES[section];
    if (this.currentTheme === 'electronic') {
      type = section === 'strings' ? 'square' : section === 'brass' ? 'sawtooth' : type;
    } else if (this.currentTheme === 'spooky') {
      type = 'sine';
    } else if (this.currentTheme === 'jazz') {
      type = section === 'woodwinds' ? 'triangle' : type;
    } else if (this.currentTheme === 'rock') {
      type = 'sawtooth'; // More aggressive
    } else if (this.currentTheme === 'blues') {
      type = 'sawtooth'; // Soulful
    }

    const osc = this.ctx.createOscillator();
    osc.type = type;
    
    // Transpose base frequencies based on theme for a different feel
    let transpose = 0;
    if (this.currentTheme === 'jazz') transpose = -2;
    if (this.currentTheme === 'spooky') transpose = 1;
    if (this.currentTheme === 'electronic') transpose = -12; // deep
    if (this.currentTheme === 'epic') transpose = -7;
    if (this.currentTheme === 'folk') transpose = 5;
    if (this.currentTheme === 'rock') transpose = -5; // heavier
    if (this.currentTheme === 'reggae') transpose = 2; // brighter
    if (this.currentTheme === 'latin') transpose = -3; // warm
    if (this.currentTheme === 'blues') transpose = -4; // soulful

    let finalFreq = freq;
    if (transpose !== 0) {
      finalFreq = freq * Math.pow(2, transpose / 12);
    }

    // If chaotic, sharply detune notes to microtonal messes
    if (isChaotic) {
       if (chaosType === 'sleepy') {
          finalFreq *= 0.5; // octave lower, sleepy
       } else if (chaosType === 'hyperactive') {
          finalFreq *= 2.0; // octave higher, hyper
       } else {
          finalFreq *= (0.9 + Math.random() * 0.2); // Random pitch sliding
       }
    }
    osc.frequency.setValueAtTime(finalFreq, this.ctx.currentTime);

    // Add drastic vibrato for chaotic
    if (isChaotic && chaosType !== 'sleepy') {
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.frequency.value = chaosType === 'hyperactive' ? 30 : 15; // fast wide warble
      lfoGain.gain.value = finalFreq * 0.1;
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      lfo.start();
      setTimeout(() => lfo.stop(), this.beatInterval);
    }

    const envelope = this.ctx.createGain();
    envelope.gain.setValueAtTime(0, this.ctx.currentTime);
    
    if (isChaotic && chaosType === 'sleepy') {
      // Long, slow attack
      envelope.gain.linearRampToValueAtTime(0.6, this.ctx.currentTime + 0.3);
      envelope.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 1.2);
    } else if (isChaotic && chaosType === 'hyperactive') {
      // Very fast, staccato
      envelope.gain.linearRampToValueAtTime(0.8, this.ctx.currentTime + 0.01);
      envelope.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
    } else {
      // Normal / wrong notes
      envelope.gain.linearRampToValueAtTime(0.8, this.ctx.currentTime + 0.02);
      envelope.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + (this.beatInterval / 1000) * 0.8);
    }

    const targetGain = isChaotic ? sectionAudio.chaoticGain : sectionAudio.correctGain;
    osc.connect(envelope);
    envelope.connect(targetGain);

    osc.start();
    if (isChaotic && chaosType === 'sleepy') {
      osc.stop(this.ctx.currentTime + 1.2);
    } else if (isChaotic && chaosType === 'hyperactive') {
      osc.stop(this.ctx.currentTime + 0.15);
      
      // Schedule an extra jittery note halfway through the beat
      setTimeout(() => {
        if (!this.ctx || !this.isPlaying) return;
        const osc2 = this.ctx.createOscillator();
        osc2.type = type;
        osc2.frequency.setValueAtTime(finalFreq * 1.5, this.ctx.currentTime);
        const env2 = this.ctx.createGain();
        env2.gain.setValueAtTime(0, this.ctx.currentTime);
        env2.gain.linearRampToValueAtTime(0.8, this.ctx.currentTime + 0.01);
        env2.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
        osc2.connect(env2);
        env2.connect(targetGain);
        osc2.start();
        osc2.stop(this.ctx.currentTime + 0.15);
      }, this.beatInterval / 2);
    } else {
      osc.stop(this.ctx.currentTime + (this.beatInterval / 1000));
    }
  }

  private scheduleNotes() {
    const sectionKeys: OrchestraSection[] = ['strings', 'woodwinds', 'brass', 'percussion'];

    for (const key of sectionKeys) {
      // Play correct note
      this.playNote(key, false);
      // Play chaotic note (will only be heard if chaotic gain > 0)
      this.playNote(key, true);

      this.currentNoteIndex[key]++;
    }
  }

  start() {
    if (this.isPlaying) return;
    this.isPlaying = true;

    this.beatInterval = 60000 / this.bpm;

    // Reset note indices
    const sectionKeys: OrchestraSection[] = ['strings', 'woodwinds', 'brass', 'percussion'];
    for (const key of sectionKeys) {
      this.currentNoteIndex[key] = 0;
    }

    // Schedule notes on each beat
    this.beatStartTime = performance.now();
    this.scheduleNotes(); // Play first immediately
    this.schedulerTimer = window.setInterval(() => {
      this.beatStartTime = performance.now();
      this.scheduleNotes();
    }, this.beatInterval);
  }

  stop() {
    this.isPlaying = false;
    if (this.schedulerTimer !== null) {
      clearInterval(this.schedulerTimer);
      this.schedulerTimer = null;
    }
    for (const timer of this.noteTimers) {
      clearTimeout(timer);
    }
    this.noteTimers = [];
  }

  /** Returns 0→1 representing how far through the current beat we are (wraps each beat). */
  getBeatPhase(): number {
    if (!this.isPlaying || this.beatInterval === 0) return 0;
    const elapsed = performance.now() - this.beatStartTime;
    return Math.min(1, elapsed / this.beatInterval);
  }

  /** True during the first 25% of each beat window — the "on-beat" moment. */
  isOnBeat(beatWindowMultiplier: number = 1): boolean {
    return this.getBeatPhase() < (0.25 * beatWindowMultiplier);
  }

  // Crossfade a section between correct (0) and chaotic (1)
  setChaosLevel(section: OrchestraSection, level: number) {
    const sec = this.sections[section];
    if (!sec || !this.ctx) return;

    const t = this.ctx.currentTime;
    sec.correctGain.gain.cancelScheduledValues(t);
    sec.chaoticGain.gain.cancelScheduledValues(t);
    sec.correctGain.gain.linearRampToValueAtTime(1 - level, t + 0.5);
    sec.chaoticGain.gain.linearRampToValueAtTime(level, t + 0.5);
  }

  // Play a satisfying magical Major Arpeggio chime
  playFixChime() {
    if (!this.ctx || !this.masterGain) return;
    
    // Frequencies for a C Major Arpeggio: C5, E5, G5, C6
    const freqs = [523.25, 659.25, 783.99, 1046.50];
    
    for (let i = 0; i < freqs.length; i++) {
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        const startTime = this.ctx.currentTime + (i * 0.05); // Stagger start times
        osc.frequency.setValueAtTime(freqs[i], startTime);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.2, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(startTime);
        osc.stop(startTime + 0.3);
    }
  }

  // Whiplash-inspired intense drum hit
  playWhiplashHit() {
    if (!this.ctx || !this.masterGain) return;
    
    // Kick drum with more punch
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(100, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.4);

    const envelope = this.ctx.createGain();
    envelope.gain.setValueAtTime(0.9, this.ctx.currentTime);
    envelope.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);

    osc.connect(envelope);
    envelope.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.4);
  }

  // Whiplash-inspired snare hit
  playWhiplashSnare() {
    if (!this.ctx || !this.masterGain) return;
    
    // White noise for snare
    const bufferSize = this.ctx.sampleRate * 0.15;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.value = 1500;

    const envelope = this.ctx.createGain();
    envelope.gain.setValueAtTime(0.8, this.ctx.currentTime);
    envelope.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);

    noise.connect(noiseFilter);
    noiseFilter.connect(envelope);
    envelope.connect(this.masterGain);
    noise.start();
  }

  // Whiplash-inspired cymbal crash
  playWhiplashCymbal() {
    if (!this.ctx || !this.masterGain) return;
    
    // White noise for cymbal
    const bufferSize = this.ctx.sampleRate * 1.0;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.value = 2000;

    const envelope = this.ctx.createGain();
    envelope.gain.setValueAtTime(0.6, this.ctx.currentTime);
    envelope.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.0);

    noise.connect(noiseFilter);
    noiseFilter.connect(envelope);
    envelope.connect(this.masterGain);
    noise.start();
  }

  // Play warning horn when chaos initiates
  playWarning() {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(140, this.ctx.currentTime + 0.3);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(500, this.ctx.currentTime);
    filter.frequency.linearRampToValueAtTime(2000, this.ctx.currentTime + 0.1);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.3, this.ctx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.4);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.4);
  }

  // Play ominous spread sound
  playChaosSpread() {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.6);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.6);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.6);
  }

  // Baton whoosh
  playWhoosh() {
    if (!this.ctx || !this.masterGain) return;
    const bufferSize = this.ctx.sampleRate * 0.15;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 2000;
    filter.Q.value = 2;

    const gain = this.ctx.createGain();
    gain.gain.value = 0.08;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    source.start();
  }

  // AI Crowd Cheers (synthesized pinkish noise sweep)
  playCheers() {
    if (!this.ctx || !this.masterGain) return;
    const duration = 4.0;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0;
    
    // Generate pink-ish noise
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + (0.02 * white)) / 1.02; // Very simple pink filter
      lastOut = data[i];
      data[i] *= 3.5; // Compensate for gain drop
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;

    // Filter to sound like a crowd (bandpass sweeping up)
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(600, this.ctx.currentTime);
    filter.frequency.linearRampToValueAtTime(1200, this.ctx.currentTime + duration * 0.5);
    filter.Q.value = 0.5;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.4, this.ctx.currentTime + 1.0); // swell up
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    source.start();
  }

  // AI Crowd Boo/Groan (synthesized low noise sweep)
  playBoo() {
    if (!this.ctx || !this.masterGain) return;
    const duration = 3.0;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    // Generate white noise
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;

    // Filter to sound like a low groan (lowpass sweeping down)
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, this.ctx.currentTime);
    filter.frequency.linearRampToValueAtTime(150, this.ctx.currentTime + duration * 0.8);
    filter.Q.value = 1; // resonant bump

    const filter2 = this.ctx.createBiquadFilter(); // second filter for mud
    filter2.type = 'bandpass';
    filter2.frequency.setValueAtTime(250, this.ctx.currentTime);
    filter2.Q.value = 0.2;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.5, this.ctx.currentTime + 0.5); // ground swell
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

    source.connect(filter);
    filter.connect(filter2);
    filter2.connect(gain);
    gain.connect(this.masterGain);
    source.start();
  }

  destroy() {
    this.stop();
    this.ctx?.close();
  }
}

// Singleton
export const audioMixer = new AudioMixer();
