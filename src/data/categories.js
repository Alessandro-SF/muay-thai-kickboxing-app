/** Workout categories shown in the library and on the home page. */
export const CATEGORIES = [
  { id: 'boxing', name: 'Boxing Combinations', short: 'Boxing', icon: 'Hand', blurb: 'Sharp hands with the 1–6 punch system.' },
  { id: 'kickboxing', name: 'Kickboxing Combinations', short: 'Kickboxing', icon: 'Zap', blurb: 'Punches flowing into kicks — no elbows, no clinch.' },
  { id: 'fundamentals', name: 'Muay Thai Fundamentals', short: 'Fundamentals', icon: 'GraduationCap', blurb: 'Stance, guard and the eight limbs done right.' },
  { id: 'heavy-bag', name: 'Heavy Bag Training', short: 'Heavy Bag', icon: 'Target', blurb: 'Power, volume and conditioning on the bag.' },
  { id: 'shadowboxing', name: 'Shadowboxing', short: 'Shadow', icon: 'Ghost', blurb: 'No equipment. Rhythm, flow and visualization.' },
  { id: 'kicks-knees', name: 'Kicks and Knees', short: 'Kicks & Knees', icon: 'Footprints', blurb: 'Roundhouse kicks, teeps and knees.' },
  { id: 'elbows-clinch', name: 'Elbows and Clinch Fundamentals', short: 'Elbows & Clinch', icon: 'Swords', blurb: 'Close-range weapons of the art of eight limbs.' },
  { id: 'footwork-defense', name: 'Footwork and Defense', short: 'Defense', icon: 'Shield', blurb: 'Slips, checks, pivots and counters.' },
  { id: 'conditioning', name: 'Cardio and Conditioning', short: 'Conditioning', icon: 'HeartPulse', blurb: 'Fight-pace intervals that build your gas tank.' },
  { id: 'full-session', name: 'Full Muay Thai Sessions', short: 'Full Session', icon: 'Trophy', blurb: 'Complete camp-style sessions from warm-up to finish.' },
];

export const CATEGORY_BY_ID = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));

export const DISCIPLINES = {
  'muay-thai': { id: 'muay-thai', name: 'Muay Thai' },
  kickboxing: { id: 'kickboxing', name: 'Kickboxing' },
};

export const LEVEL_INFO = {
  beginner: { id: 'beginner', name: 'Beginner', dots: 1 },
  intermediate: { id: 'intermediate', name: 'Intermediate', dots: 2 },
  advanced: { id: 'advanced', name: 'Advanced', dots: 3 },
};

export const DURATIONS = [5, 10, 15, 20, 30, 45];
