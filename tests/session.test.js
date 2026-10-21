import { describe, it, expect } from 'vitest';
import { WORKOUTS } from '../src/data/workouts';
import { CATEGORIES, DURATIONS } from '../src/data/categories';
import {
  buildSession, workoutTotalSeconds, advance, initialEngineState, elapsedTotal,
  roundsCompleted, skipSegment, estimateSpeechSeconds,
} from '../src/lib/session';
import { buildCustomWorkout, roundsForDuration, sanitizeQuickConfig } from '../src/lib/customWorkout';

describe('workout library', () => {
  it('has at least 12 distinct workouts with required fields', () => {
    expect(WORKOUTS.length).toBeGreaterThanOrEqual(12);
    expect(new Set(WORKOUTS.map((w) => w.id)).size).toBe(WORKOUTS.length);
    for (const w of WORKOUTS) {
      for (const k of ['title', 'description', 'category', 'level', 'duration', 'focus', 'equipment', 'rounds']) expect(w[k], `${w.id}.${k}`).toBeTruthy();
      expect(CATEGORIES.map((c) => c.id)).toContain(w.category);
    }
  });

  it('covers every category, level and duration', () => {
    for (const c of CATEGORIES) expect(WORKOUTS.some((w) => w.category === c.id), c.id).toBe(true);
    for (const l of ['beginner', 'intermediate', 'advanced']) expect(WORKOUTS.some((w) => w.level === l)).toBe(true);
    for (const d of DURATIONS) expect(WORKOUTS.some((w) => w.duration === d), `${d} min`).toBe(true);
  });

  it('nominal duration matches the actual timeline within a minute', () => {
    for (const w of WORKOUTS) expect(Math.abs(workoutTotalSeconds(w) - w.duration * 60), w.id).toBeLessThanOrEqual(60);
  });
});

describe('session builder', () => {
  it('is deterministic for the same seed and differs for another seed', () => {
    const w = WORKOUTS.find((x) => x.id === 'kickboxing-combo-flow');
    const a = JSON.stringify(buildSession(w, { seed: 1 }));
    expect(JSON.stringify(buildSession(w, { seed: 1 }))).toBe(a);
    expect(JSON.stringify(buildSession(w, { seed: 2 }))).not.toBe(a);
  });

  it('never schedules overlapping speech', () => {
    for (const w of WORKOUTS) {
      const s = buildSession(w, { seed: 7 });
      for (const seg of s.segments) {
        const spoken = seg.events.filter((e) => e.type === 'say' || e.type === 'combo');
        for (let i = 1; i < spoken.length; i++) {
          const prev = spoken[i - 1];
          // The final "workout complete" call coincides with the end bell only.
          expect(spoken[i].at, `${w.id} ${seg.label}: "${prev.text}" → "${spoken[i].text}"`).toBeGreaterThanOrEqual(prev.at + estimateSpeechSeconds(prev.text) - 0.01);
        }
      }
    }
  });

  it('uses realistic callout spacing by level', () => {
    const gaps = (id) => {
      const s = buildSession(WORKOUTS.find((w) => w.id === id), { seed: 3 });
      const out = [];
      for (const seg of s.segments) {
        const c = seg.events.filter((e) => e.type === 'combo');
        for (let i = 1; i < c.length; i++) out.push(c[i].at - c[i - 1].at);
      }
      return out.reduce((a, b) => a + b, 0) / out.length;
    };
    const beginner = gaps('kickboxing-starter');
    const advanced = gaps('boxing-power-rounds');
    expect(beginner).toBeGreaterThan(5.5);
    expect(advanced).toBeGreaterThanOrEqual(3);
    expect(advanced).toBeLessThan(5);
  });

  it('includes round/rest structure and time calls', () => {
    const s = buildSession(WORKOUTS.find((w) => w.id === 'kicks-knees-arsenal'));
    const kinds = s.segments.map((x) => x.kind);
    expect(kinds[0]).toBe('prep');
    expect(kinds.filter((k) => k === 'round')).toHaveLength(5);
    expect(kinds.filter((k) => k === 'rest')).toHaveLength(4);
    const texts = s.segments.flatMap((seg) => seg.events.filter((e) => e.text).map((e) => e.text));
    expect(texts).toContain('Thirty seconds remaining.');
    expect(texts).toContain('Round complete. Rest for 1 minute.');
    expect(texts).toContain('Get ready. Next round starts in ten seconds.');
  });
});

describe('engine', () => {
  const w = WORKOUTS.find((x) => x.id === 'shadow-warmup-5');
  const s = buildSession(w, { seed: 1 });

  it('runs to completion firing every event exactly once', () => {
    let st = initialEngineState();
    const fired = [];
    let guard = 0;
    while (!st.finished && guard++ < 100000) {
      const r = advance(s, st, 0.1);
      st = r.state;
      fired.push(...r.fired);
    }
    const expected = s.segments.reduce((n, seg) => n + seg.events.length, 0);
    expect(fired.filter((e) => !['segment', 'finish'].includes(e.type))).toHaveLength(expected);
    expect(fired.at(-1).type).toBe('finish');
    expect(roundsCompleted(s, st)).toBe(3);
    expect(Math.round(elapsedTotal(s, st))).toBe(s.totalSeconds);
  });

  it('does not progress while paused (no advance calls) and resumes exactly', () => {
    let { state } = advance(s, initialEngineState(), 12.5); // into round 1
    expect(state.segIndex).toBe(1);
    const paused = { ...state };
    // A paused player simply stops calling advance; resuming continues from the same point.
    const { state: resumed } = advance(s, paused, 0.5);
    expect(elapsedTotal(s, resumed)).toBeCloseTo(13, 5);
  });

  it('handles large time jumps (background tab) without losing segments', () => {
    const { state, fired } = advance(s, initialEngineState(), 200);
    expect(elapsedTotal(s, state)).toBeCloseTo(200, 5);
    expect(fired.filter((e) => e.type === 'segment').length).toBeGreaterThan(2);
  });

  it('skips a segment', () => {
    const st = skipSegment(s, initialEngineState());
    expect(st.segIndex).toBe(1);
    expect(st.elapsed).toBe(0);
  });
});

describe('quick training', () => {
  it('sanitizes input and builds consistent rounds', () => {
    const c = sanitizeQuickConfig({ discipline: 'kickboxing', focus: 'elbows', rounds: '99', roundSeconds: 'x' });
    expect(c.focus).toBe('mixed');
    expect(c.rounds).toBe(20);
    expect(c.roundSeconds).toBe(180);
    const w = buildCustomWorkout({ discipline: 'kickboxing', rounds: 6 });
    expect(w.rounds).toHaveLength(6);
    const s = buildSession(w, { seed: 99 });
    const combos = s.segments.flatMap((seg) => seg.events.filter((e) => e.type === 'combo'));
    expect(combos.length).toBeGreaterThan(10);
    for (const e of combos) expect(e.ids.join(' ')).not.toMatch(/elbow|clinch|turn/i);
  });

  it('computes rounds for a target duration', () => {
    expect(roundsForDuration(20, 180, 60)).toBe(5);
    expect(roundsForDuration(5, 180, 60)).toBe(1);
    expect(roundsForDuration(45, 120, 30)).toBe(18);
  });
});
