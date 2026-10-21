/**
 * Quick Training: turn user settings into a structured workout definition.
 * The result has the same shape as the authored workouts, so the same player
 * and session builder are used. Combination order is fixed by the seed.
 */

export const QUICK_FOCUS_OPTIONS = [
  { id: 'mixed', name: 'All-round', description: 'Rotates through every weapon.' },
  { id: 'boxing', name: 'Boxing hands', description: 'Punch combinations only.' },
  { id: 'kicks', name: 'Kicks', description: 'Punch-to-kick combinations, teeps.' },
  { id: 'knees', name: 'Knees', description: 'Knee setups and clinch knees.', muayThaiLabel: 'Knees & clinch' },
  { id: 'elbows', name: 'Elbows', description: 'Short-range elbow work.', muayThaiOnly: true },
  { id: 'defense', name: 'Defense & counters', description: 'Slips, checks, blocks and counters.' },
];

export const DEFAULT_QUICK_CONFIG = {
  discipline: 'muay-thai',
  level: 'beginner',
  roundSeconds: 180,
  restSeconds: 60,
  rounds: 3,
  focus: 'mixed',
  stance: 'orthodox',
  audio: true,
};

const ROTATIONS = {
  'muay-thai': [
    { title: 'Boxing Combinations', focus: ['boxing'], instruction: 'Hands only. Sharp and tight.' },
    { title: 'Kicks off the Hands', focus: ['kicks'], instruction: 'Finish combinations with kicks.' },
    { title: 'Knees & Clinch', focus: ['knees', 'clinch'], instruction: 'Close range: knees and clinch.' },
    { title: 'Elbows', focus: ['elbows'], instruction: 'Step in and cut with the elbows.' },
    { title: 'Defense & Counters', focus: ['defense', 'footwork'], instruction: 'Defend, then counter.' },
    { title: 'Eight Limbs', focus: ['mixed'], instruction: 'Everything together.' },
  ],
  kickboxing: [
    { title: 'Boxing Combinations', focus: ['boxing'], instruction: 'Hands only. Sharp and tight.' },
    { title: 'Kicks off the Hands', focus: ['kicks'], instruction: 'Finish combinations with kicks.' },
    { title: 'Knees', focus: ['knees'], instruction: 'Knee setups at close range.' },
    { title: 'Defense & Counters', focus: ['defense', 'footwork'], instruction: 'Defend, then counter.' },
    { title: 'Full Kickboxing', focus: ['mixed'], instruction: 'Everything together.' },
  ],
};

const FOCUS_TITLES = {
  boxing: ['Jab & Cross', 'Hooks & Uppercuts', 'Body & Head', 'Volume Hands', 'Speed Combinations'],
  kicks: ['Low Kicks', 'Body Kicks', 'Teeps & Kicks', 'Kick Setups', 'Kick Volume'],
  knees: ['Knee Setups', 'Long Knees', 'Knee Combinations', 'Knee Volume'],
  elbows: ['Elbow Entries', 'Punches to Elbows', 'Elbow Combinations', 'Inside Fighting'],
  defense: ['Slip & Counter', 'Check & Return', 'Block & Fire', 'Counter Fighter'],
};

const FOCUS_TAGS = {
  boxing: ['boxing'],
  kicks: ['kicks', 'teeps'],
  knees: ['knees', 'clinch'],
  elbows: ['elbows'],
  defense: ['defense', 'footwork'],
};

export function sanitizeQuickConfig(input = {}) {
  const c = { ...DEFAULT_QUICK_CONFIG, ...input };
  const clamp = (n, lo, hi, d) => (Number.isFinite(Number(n)) ? Math.min(hi, Math.max(lo, Math.round(Number(n)))) : d);
  c.discipline = c.discipline === 'kickboxing' ? 'kickboxing' : 'muay-thai';
  c.level = ['beginner', 'intermediate', 'advanced'].includes(c.level) ? c.level : 'beginner';
  c.stance = c.stance === 'southpaw' ? 'southpaw' : 'orthodox';
  c.roundSeconds = clamp(c.roundSeconds, 30, 600, 180);
  c.restSeconds = clamp(c.restSeconds, 0, 300, 60);
  c.rounds = clamp(c.rounds, 1, 20, 3);
  if (!QUICK_FOCUS_OPTIONS.some((f) => f.id === c.focus)) c.focus = 'mixed';
  if (c.discipline === 'kickboxing' && c.focus === 'elbows') c.focus = 'mixed';
  c.audio = c.audio !== false && c.audio !== 'false' && c.audio !== '0';
  return c;
}

/** Number of rounds that best fits a target total length in minutes. */
export function roundsForDuration(minutes, roundSeconds, restSeconds, prepSeconds = 10) {
  const n = Math.round((minutes * 60 - prepSeconds + restSeconds) / (roundSeconds + restSeconds));
  return Math.max(1, Math.min(20, n));
}

export function buildCustomWorkout(input) {
  const c = sanitizeQuickConfig(input);
  const rounds = [];
  for (let i = 0; i < c.rounds; i++) {
    if (c.focus === 'mixed') {
      const rotation = ROTATIONS[c.discipline];
      // Last round of a multi-round session is always the "everything" round.
      const r = i === c.rounds - 1 && c.rounds > 1 ? rotation[rotation.length - 1] : rotation[i % rotation.length];
      rounds.push({ mode: 'combos', ...r });
    } else {
      const titles = FOCUS_TITLES[c.focus];
      rounds.push({
        mode: 'combos',
        title: titles[i % titles.length],
        focus: FOCUS_TAGS[c.focus],
        instruction: 'Stay focused on clean technique.',
      });
    }
  }
  const discipline = c.discipline === 'kickboxing' ? 'Kickboxing' : 'Muay Thai';
  return {
    id: 'quick',
    title: `Quick ${discipline} Session`,
    category: c.discipline === 'kickboxing' ? 'kickboxing' : 'full-session',
    discipline: c.discipline,
    level: c.level,
    roundSeconds: c.roundSeconds,
    restSeconds: c.restSeconds,
    prepSeconds: 10,
    focus: QUICK_FOCUS_OPTIONS.find((f) => f.id === c.focus).name,
    equipment: ['Your choice'],
    description: 'A custom session generated from your Quick Training settings.',
    rounds,
    custom: true,
  };
}
