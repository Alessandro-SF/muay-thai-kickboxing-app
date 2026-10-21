import { TECHNIQUES, MUAY_THAI_ONLY_TYPES } from '../data/techniques';
import { CURATED_COMBOS } from '../data/combos';

export const LEVELS = ['beginner', 'intermediate', 'advanced'];
export const FOCUS_TAGS = ['boxing', 'kicks', 'teeps', 'knees', 'elbows', 'defense', 'footwork', 'clinch'];

const KICK_TYPES = ['kick', 'teep'];

/** Parse "jab cross lhook" → ['jab','cross','lhook'], throwing on unknown ids. */
export function parseCombo(str) {
  const ids = str.trim().split(/\s+/);
  for (const id of ids) {
    if (!TECHNIQUES[id]) throw new Error(`Unknown technique "${id}" in combo "${str}"`);
  }
  return ids;
}

/** Human label for a technique, mirrored for southpaw. */
export function techniqueLabel(id, stance = 'orthodox') {
  const tech = TECHNIQUES[id];
  const lead = stance === 'southpaw' ? 'Right' : 'Left';
  const rear = stance === 'southpaw' ? 'Left' : 'Right';
  return tech.name.replace('{L}', lead).replace('{R}', rear);
}

/** Text the coach speaks for a combination: "Jab, cross, left hook." */
export function spokenCombo(ids, stance = 'orthodox') {
  const parts = ids.map((id, i) => {
    const label = techniqueLabel(id, stance);
    return i === 0 ? label : label.charAt(0).toLowerCase() + label.slice(1);
  });
  return `${parts.join(', ')}.`;
}

/** Derive focus tags from a combination's techniques. */
export function comboTags(ids) {
  const types = new Set(ids.map((id) => TECHNIQUES[id].type));
  const tags = new Set();
  const offensive = [...types].filter((t) => !['defense', 'footwork'].includes(t));
  if (offensive.length > 0 && offensive.every((t) => t === 'punch')) tags.add('boxing');
  if (types.has('kick') || types.has('teep')) tags.add('kicks');
  if (types.has('teep')) tags.add('teeps');
  if (types.has('knee')) tags.add('knees');
  if (types.has('elbow')) tags.add('elbows');
  if (types.has('defense')) tags.add('defense');
  if (types.has('footwork')) tags.add('footwork');
  if (types.has('clinch')) tags.add('clinch');
  return [...tags];
}

export function isMuayThaiOnly(ids) {
  return ids.some((id) => MUAY_THAI_ONLY_TYPES.includes(TECHNIQUES[id].type));
}

/**
 * Check a combination against the default orthodox-stance rules.
 * Returns a list of human-readable problems (empty = valid).
 *
 *  - A kick/teep straight after a punch should come off the opposite side
 *    (rear hand → lead-side kick, lead hand → rear-side kick).
 *  - No kick straight after an elbow.
 *  - No immediate repetition of a non-punch technique (e.g. "rlow rlow").
 */
export function validateCombo(ids) {
  const problems = [];
  for (let i = 1; i < ids.length; i++) {
    const prev = TECHNIQUES[ids[i - 1]];
    const cur = TECHNIQUES[ids[i]];
    if (KICK_TYPES.includes(cur.type)) {
      if (prev.type === 'punch' && prev.side && cur.side && prev.side === cur.side) {
        problems.push(`${cur.id} after ${prev.id} comes off the same side`);
      }
      if (prev.type === 'elbow') problems.push(`kick ${cur.id} directly after elbow ${prev.id}`);
    }
    if (prev.id === cur.id && cur.type !== 'punch') problems.push(`repeated ${cur.id}`);
  }
  return problems;
}

// ── Generated combinations ────────────────────────────────────────────────

const PUNCH_SEQUENCES = {
  beginner: ['jab', 'jab cross', 'jab jab cross', 'cross lhook', 'jab lhook'],
  intermediate: [
    'jab cross lhook', 'jab cross lhook cross', 'lhook cross', 'jab rupper lhook',
    'cross lhook cross', 'jab cross lupper', 'jab jab cross',
  ],
  advanced: [
    'jab cross lhook rupper', 'lupper lhook cross', 'jab rhook lhook cross',
    'jab cross lhookBody lhook', 'cross lhook cross lhook', 'jab cross lhook cross',
  ],
};

const FINISHERS = {
  beginner: { kick: ['low', 'body'], knee: true, elbow: false },
  intermediate: { kick: ['low', 'body', 'head'], knee: true, elbow: true },
  advanced: { kick: ['low', 'body', 'head'], knee: true, elbow: true },
};

/**
 * Build combinations as "punch sequence + finisher", where the finisher always
 * comes off the side opposite the last punch. Deterministic (no randomness).
 */
export function generatedCombos(level) {
  const out = [];
  const rule = FINISHERS[level];
  for (const seq of PUNCH_SEQUENCES[level]) {
    const ids = parseCombo(seq);
    const last = TECHNIQUES[ids[ids.length - 1]];
    const finishSide = last.side === 'R' ? 'l' : 'r';
    for (const height of rule.kick) out.push(`${seq} ${finishSide}${height}`);
    if (rule.knee) out.push(`${seq} ${finishSide}knee`);
    if (rule.elbow) {
      out.push(`${seq} ${finishSide}elbow`);
      if (level === 'advanced') out.push(`${seq} ${finishSide}elbow ${finishSide === 'l' ? 'r' : 'l'}elbow`);
    }
  }
  return out;
}

/**
 * All combinations available for a discipline and level, with metadata.
 * Lower-level combinations are included (with lower weight) for variety.
 */
export function comboLibrary({ discipline = 'muay-thai', level = 'beginner' } = {}) {
  const maxIdx = LEVELS.indexOf(level);
  const seen = new Set();
  const out = [];
  LEVELS.slice(0, maxIdx + 1).forEach((lvl, idx) => {
    const sources = [...CURATED_COMBOS[lvl], ...generatedCombos(lvl)];
    for (const str of sources) {
      const key = str.trim();
      if (seen.has(key)) continue;
      seen.add(key);
      const ids = parseCombo(key);
      if (discipline === 'kickboxing' && isMuayThaiOnly(ids)) continue;
      out.push({
        key,
        ids,
        level: lvl,
        tags: comboTags(ids),
        weight: idx === maxIdx ? 3 : 1,
      });
    }
  });
  return out;
}

/**
 * Filter a library by focus tags. 'mixed' (or an empty list) keeps everything.
 * Falls back to the whole library if the focus would leave nothing.
 */
export function filterByFocus(library, focus = ['mixed']) {
  const list = Array.isArray(focus) ? focus : [focus];
  if (list.length === 0 || list.includes('mixed')) return library;
  const filtered = library.filter((c) => c.tags.some((t) => list.includes(t)));
  return filtered.length > 0 ? filtered : library;
}

/**
 * Stateful picker that avoids repeating recent combinations.
 * `rng` must be a function returning [0, 1).
 */
export function createComboPicker(pool, rng, memory = 4) {
  const recent = [];
  const avoid = Math.min(memory, Math.max(0, pool.length - 1));
  return function pick() {
    const candidates = pool.filter((c) => !recent.slice(-avoid).includes(c.key));
    const list = candidates.length > 0 ? candidates : pool;
    const total = list.reduce((sum, c) => sum + c.weight, 0);
    let roll = rng() * total;
    let choice = list[list.length - 1];
    for (const c of list) {
      roll -= c.weight;
      if (roll < 0) {
        choice = c;
        break;
      }
    }
    recent.push(choice.key);
    if (recent.length > memory) recent.shift();
    return choice;
  };
}
