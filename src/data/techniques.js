/**
 * Technique catalog.
 *
 * Every technique is described from the ORTHODOX stance (left foot forward).
 * `side` is the limb used in orthodox: 'L' = lead side, 'R' = rear side.
 * For southpaw the engine mirrors sides (see lib/combos.js → techniqueLabel).
 *
 * Punch numbering follows the standard system:
 *   1 Jab · 2 Cross · 3 Left hook · 4 Right hook · 5 Left uppercut · 6 Right uppercut
 *
 * `audio` (optional): path to a prerecorded clip in /public/audio. When present the
 * player can use the clip instead of browser speech synthesis. None are bundled yet.
 */

export const TECHNIQUE_TYPES = {
  punch: { label: 'Punch', color: 'red' },
  kick: { label: 'Kick', color: 'orange' },
  knee: { label: 'Knee', color: 'amber' },
  elbow: { label: 'Elbow', color: 'rose' },
  teep: { label: 'Teep', color: 'yellow' },
  defense: { label: 'Defense', color: 'sky' },
  footwork: { label: 'Footwork', color: 'emerald' },
  clinch: { label: 'Clinch', color: 'violet' },
};

// `name` may contain {side} which renders as "Left"/"Right" depending on stance.
const t = (id, type, name, extra = {}) => ({ id, type, name, ...extra });

export const TECHNIQUES = {
  // ── Punches ──────────────────────────────────────────────
  jab: t('jab', 'punch', 'Jab', { side: 'L', number: '1' }),
  cross: t('cross', 'punch', 'Cross', { side: 'R', number: '2' }),
  lhook: t('lhook', 'punch', '{L} hook', { side: 'L', number: '3' }),
  rhook: t('rhook', 'punch', '{R} hook', { side: 'R', number: '4' }),
  lupper: t('lupper', 'punch', '{L} uppercut', { side: 'L', number: '5' }),
  rupper: t('rupper', 'punch', '{R} uppercut', { side: 'R', number: '6' }),
  jabBody: t('jabBody', 'punch', 'Jab to the body', { side: 'L', number: '1b' }),
  crossBody: t('crossBody', 'punch', 'Cross to the body', { side: 'R', number: '2b' }),
  lhookBody: t('lhookBody', 'punch', '{L} hook to the body', { side: 'L', number: '3b' }),
  rhookBody: t('rhookBody', 'punch', '{R} hook to the body', { side: 'R', number: '4b' }),

  // ── Kicks ────────────────────────────────────────────────
  llow: t('llow', 'kick', '{L} low kick', { side: 'L' }),
  rlow: t('rlow', 'kick', '{R} low kick', { side: 'R' }),
  lbody: t('lbody', 'kick', '{L} body kick', { side: 'L' }),
  rbody: t('rbody', 'kick', '{R} body kick', { side: 'R' }),
  lhead: t('lhead', 'kick', '{L} head kick', { side: 'L' }),
  rhead: t('rhead', 'kick', '{R} head kick', { side: 'R' }),
  switchKick: t('switchKick', 'kick', 'Switch kick', { side: 'L' }),

  // ── Teeps ────────────────────────────────────────────────
  lteep: t('lteep', 'teep', '{L} teep', { side: 'L' }),
  rteep: t('rteep', 'teep', '{R} teep', { side: 'R' }),

  // ── Knees ────────────────────────────────────────────────
  lknee: t('lknee', 'knee', '{L} knee', { side: 'L' }),
  rknee: t('rknee', 'knee', '{R} knee', { side: 'R' }),
  switchKnee: t('switchKnee', 'knee', 'Switch knee', { side: 'L' }),

  // ── Elbows (Muay Thai only) ──────────────────────────────
  lelbow: t('lelbow', 'elbow', '{L} elbow', { side: 'L' }),
  relbow: t('relbow', 'elbow', '{R} elbow', { side: 'R' }),
  lupElbow: t('lupElbow', 'elbow', '{L} uppercut elbow', { side: 'L' }),
  rupElbow: t('rupElbow', 'elbow', '{R} uppercut elbow', { side: 'R' }),
  spinElbow: t('spinElbow', 'elbow', 'Spinning back elbow', { side: 'R' }),

  // ── Defense ──────────────────────────────────────────────
  slip: t('slip', 'defense', 'Slip'),
  roll: t('roll', 'defense', 'Roll under'),
  block: t('block', 'defense', 'Block'),
  parry: t('parry', 'defense', 'Parry'),
  lcheck: t('lcheck', 'defense', 'Check {L}', { side: 'L' }),
  rcheck: t('rcheck', 'defense', 'Check {R}', { side: 'R' }),
  lean: t('lean', 'defense', 'Lean back'),

  // ── Footwork ─────────────────────────────────────────────
  stepIn: t('stepIn', 'footwork', 'Step in'),
  stepBack: t('stepBack', 'footwork', 'Step back'),
  pivot: t('pivot', 'footwork', 'Pivot'),
  angle: t('angle', 'footwork', 'Angle out'),

  // ── Clinch (Muay Thai only) ──────────────────────────────
  clinch: t('clinch', 'clinch', 'Clinch up'),
  turn: t('turn', 'clinch', 'Turn and off-balance'),
};

/** Technique types that are not allowed in Kickboxing workouts. */
export const MUAY_THAI_ONLY_TYPES = ['elbow', 'clinch'];
