import { describe, it, expect } from 'vitest';
import { CURATED_COMBOS } from '../src/data/combos';
import { WORKOUTS } from '../src/data/workouts';
import {
  parseCombo, validateCombo, generatedCombos, comboLibrary, spokenCombo, techniqueLabel,
  comboTags, createComboPicker, filterByFocus, LEVELS,
} from '../src/lib/combos';
import { createRng } from '../src/lib/random';
import { TECHNIQUES } from '../src/data/techniques';

describe('combination library', () => {
  it('only uses known techniques', () => {
    for (const lvl of LEVELS) for (const c of CURATED_COMBOS[lvl]) expect(() => parseCombo(c)).not.toThrow();
  });

  it('curated and generated combos follow the default rules', () => {
    for (const lvl of LEVELS) {
      for (const c of [...CURATED_COMBOS[lvl], ...generatedCombos(lvl)]) {
        expect(validateCombo(parseCombo(c)), c).toEqual([]);
      }
    }
  });

  it('authored workout pools follow the rules', () => {
    for (const w of WORKOUTS) for (const r of w.rounds) for (const c of r.pool ?? []) expect(validateCombo(parseCombo(c)), c).toEqual([]);
  });

  it('respects complexity by level', () => {
    for (const c of CURATED_COMBOS.beginner) expect(parseCombo(c).length).toBeLessThanOrEqual(3);
    for (const c of CURATED_COMBOS.intermediate) expect(parseCombo(c).length).toBeLessThanOrEqual(4);
    for (const c of CURATED_COMBOS.advanced) expect(parseCombo(c).length).toBeGreaterThanOrEqual(3);
  });

  it('detects rule violations', () => {
    expect(validateCombo(['jab', 'llow'])).toHaveLength(1); // lead hand → lead kick
    expect(validateCombo(['cross', 'rbody'])).toHaveLength(1); // rear hand → rear kick
    expect(validateCombo(['relbow', 'lbody'])).toHaveLength(1); // kick after elbow
    expect(validateCombo(['jab', 'cross', 'lbody'])).toEqual([]);
    expect(validateCombo(['jab', 'cross', 'lelbow'])).toEqual([]); // may finish on an elbow
  });

  it('excludes elbows and clinch from kickboxing', () => {
    for (const lvl of LEVELS) {
      for (const c of comboLibrary({ discipline: 'kickboxing', level: lvl })) {
        for (const id of c.ids) expect(['elbow', 'clinch']).not.toContain(TECHNIQUES[id].type);
      }
    }
  });

  it('includes left-side attacks and a balance of weapons', () => {
    const lib = comboLibrary({ discipline: 'muay-thai', level: 'advanced' });
    const all = lib.flatMap((c) => c.ids);
    for (const id of ['llow', 'lbody', 'lhead', 'lknee', 'lelbow', 'lteep']) expect(all).toContain(id);
    const tags = new Set(lib.flatMap((c) => c.tags));
    for (const t of ['boxing', 'kicks', 'knees', 'elbows', 'defense', 'clinch']) expect(tags).toContain(t);
  });

  it('mirrors sides for southpaw', () => {
    expect(techniqueLabel('lhook', 'orthodox')).toBe('Left hook');
    expect(techniqueLabel('lhook', 'southpaw')).toBe('Right hook');
    expect(spokenCombo(['jab', 'cross', 'lhook'])).toBe('Jab, cross, left hook.');
    expect(spokenCombo(['jab', 'cross', 'lbody'], 'southpaw')).toBe('Jab, cross, right body kick.');
  });

  it('derives tags', () => {
    expect(comboTags(['jab', 'cross'])).toEqual(['boxing']);
    expect(comboTags(['jab', 'rlow'])).toContain('kicks');
    expect(comboTags(['slip', 'cross'])).toEqual(expect.arrayContaining(['boxing', 'defense']));
  });

  it('picker never repeats a combo within its memory window', () => {
    const pool = filterByFocus(comboLibrary({ level: 'intermediate' }), ['boxing']);
    const pick = createComboPicker(pool, createRng(42));
    const seq = Array.from({ length: 200 }, () => pick().key);
    for (let i = 1; i < seq.length; i++) {
      expect(seq.slice(Math.max(0, i - 4), i)).not.toContain(seq[i]);
    }
  });
});
