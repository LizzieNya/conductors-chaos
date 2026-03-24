// Whiplash-inspired audio effects
export const WHIPLASH_SOUNDS = {
  drumHit: {
    type: 'drum',
    frequency: 60,
    decay: 0.5,
    volume: 0.8,
  },
  cymbal: {
    type: 'cymbal',
    frequency: 800,
    decay: 1.5,
    volume: 0.6,
  },
  snare: {
    type: 'snare',
    frequency: 200,
    decay: 0.3,
    volume: 0.7,
  },
  buildUp: {
    type: 'buildup',
    duration: 2,
    volume: 0.9,
  },
  climax: {
    type: 'climax',
    duration: 1,
    volume: 1,
  },
};

export const WHIPLASH_QUOTES = [
  "Don't stop!",
  "More!",
  "Faster!",
  "Harder!",
  "Again!",
  "Again!",
  "Again!",
  "Don't stop!",
  "More!",
  "Faster!",
  "Harder!",
  "Again!",
  "Again!",
  "Again!",
];

export const getWhiplashQuote = (index: number) => {
  return WHIPLASH_QUOTES[index % WHIPLASH_QUOTES.length];
};
