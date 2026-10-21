import { comboLibrary, filterByFocus, createComboPicker, parseCombo, comboTags, spokenCombo } from './combos';
import { createRng } from './random';

/** Default seconds between combination callouts, by level. */
export const DEFAULT_PACE = { beginner: 6.5, intermediate: 4, advanced: 3.3 };
const EXTRA_PER_STRIKE = { beginner: 0.8, intermediate: 0.5, advanced: 0.4 };

/** Rough speech length so callouts never overlap (≈2.6 words/second + lead-in). */
export function estimateSpeechSeconds(text) {
  const words = text.trim().split(/\s+/).length;
  return 0.5 + words / 2.6;
}

export function describeSeconds(sec) {
  if (sec >= 60 && sec % 60 === 0) {
    const m = sec / 60;
    return `${m} ${m === 1 ? 'minute' : 'minutes'}`;
  }
  return `${sec} seconds`;
}

/** Total planned length of a workout in seconds (prep + rounds + rests). */
export function workoutTotalSeconds(workout) {
  const rounds = workout.rounds.reduce((sum, r) => sum + (r.seconds ?? workout.roundSeconds), 0);
  return (workout.prepSeconds ?? 10) + rounds + workout.restSeconds * Math.max(0, workout.rounds.length - 1);
}

function overlaps(start, end, windows, margin = 0.4) {
  return windows.find(([ws, we]) => start < we + margin && end > ws - margin);
}

/**
 * Build a fully scheduled, deterministic session from a workout definition.
 * Every callout is decided up front so the session stays consistent when paused,
 * resumed or restarted.
 *
 * @param workout  workout definition (data/workouts.js or buildCustomWorkout)
 * @param options  { stance: 'orthodox'|'southpaw', seed }
 */
export function buildSession(workout, { stance = 'orthodox', seed = workout.id } = {}) {
  const rng = createRng(`${workout.id}:${seed}`);
  const level = workout.level;
  const library = comboLibrary({ discipline: workout.discipline, level });
  const basePace = workout.pace ?? DEFAULT_PACE[level];
  const totalRounds = workout.rounds.length;
  const segments = [];

  // ── Prep ────────────────────────────────────────────────
  const prep = workout.prepSeconds ?? 10;
  if (prep > 0) {
    const first = workout.rounds[0];
    segments.push({
      kind: 'prep',
      duration: prep,
      roundIndex: 0,
      label: 'Get ready',
      next: first.title,
      events: [
        say(0, `Get ready. Round one: ${first.title}. Starting in ${prep} seconds.`, 'cue'),
        ...countdownBeeps(prep),
      ],
    });
  }

  workout.rounds.forEach((round, i) => {
    const duration = round.seconds ?? workout.roundSeconds;
    const isLast = i === totalRounds - 1;
    const events = [];
    const reserved = [];
    const reserve = (at, text) => reserved.push([at, at + estimateSpeechSeconds(text)]);

    // Blocks (interval rounds) are scaled to fit the round if needed.
    const blockList = round.mode === 'blocks' ? scaleBlocks(round.blocks, duration) : [];

    // Opening call.
    const opener = `Round ${i + 1}. ${round.title}.${blockList[0] ? ` ${blockList[0].cue}` : ' Fight!'}`;
    events.push({ at: 0, type: 'bell', sound: 'start' });
    events.push(say(0.3, opener, 'cue'));
    reserve(0, opener);
    if (blockList[0]) events.push({ at: 0, type: 'block', index: 0, label: blockList[0].label });

    blockList.slice(1).forEach((blk, idx) => {
      events.push({ at: blk.start, type: 'block', index: idx + 1, label: blk.label });
      events.push(say(blk.start, blk.cue, 'cue'));
      reserve(blk.start, blk.cue);
    });

    // Time remaining calls (skipped if they would collide with a block cue).
    const timeCalls = [];
    if (duration >= 75) timeCalls.push([duration - 30, 'Thirty seconds remaining.']);
    if (duration >= 40) timeCalls.push([duration - 10, 'Ten seconds!']);
    for (const [at, text] of timeCalls) {
      if (!overlaps(at, at + estimateSpeechSeconds(text), reserved, 1)) {
        events.push(say(at, text, 'time'));
        reserve(at, text);
      }
    }
    events.push(...countdownBeeps(duration));
    reserved.push([duration - 3, duration]);

    // Fill the round with combinations or tips.
    if (round.mode === 'combos') {
      const pool = round.pool
        ? round.pool.map((key) => ({ key, ids: parseCombo(key), tags: comboTags(parseCombo(key)), weight: 1 }))
        : filterByFocus(library, round.focus);
      const pace = round.pace ?? basePace;
      events.push(...scheduleCombos({ pool, rng, from: 0, to: duration, reserved, pace, level, stance }));
    } else if (round.mode === 'tips') {
      events.push(...scheduleTips({ tips: round.tips, rng, to: duration, reserved }));
    }
    for (const blk of blockList) {
      if (blk.mode === 'combos') {
        const pool = filterByFocus(library, blk.focus);
        events.push(...scheduleCombos({ pool, rng, from: blk.start, to: blk.end, reserved, pace: basePace, level, stance }));
      }
    }

    // End of round.
    events.push({ at: duration, type: 'bell', sound: 'end' });
    if (isLast) events.push(say(duration, 'Time! Workout complete. Outstanding work.', 'cue'));

    segments.push({
      kind: 'round',
      duration,
      roundIndex: i,
      label: round.title,
      mode: round.mode,
      instruction: round.instruction ?? '',
      blocks: blockList,
      events: sortEvents(events),
    });

    // ── Rest ──────────────────────────────────────────────
    if (!isLast && workout.restSeconds > 0) {
      const rest = workout.restSeconds;
      const next = workout.rounds[i + 1];
      const restEvents = [say(0.2, `Round complete. Rest for ${describeSeconds(rest)}.`, 'cue')];
      if (rest >= 30) restEvents.push(say(Math.min(rest / 2, rest - 16), `Next round: ${next.title}.`, 'tip'));
      if (rest >= 15) restEvents.push(say(rest - 10, 'Get ready. Next round starts in ten seconds.', 'cue'));
      restEvents.push(...countdownBeeps(rest));
      segments.push({
        kind: 'rest',
        duration: rest,
        roundIndex: i,
        label: 'Rest',
        next: next.title,
        nextInstruction: next.instruction ?? '',
        events: sortEvents(restEvents),
      });
    }
  });

  return {
    workoutId: workout.id,
    title: workout.title,
    discipline: workout.discipline,
    level,
    stance,
    seed,
    totalRounds,
    totalSeconds: segments.reduce((s, seg) => s + seg.duration, 0),
    segments,
  };
}

function say(at, text, kind) {
  return { at, type: 'say', text, kind };
}

function countdownBeeps(duration) {
  if (duration < 6) return [];
  return [3, 2, 1].map((n) => ({ at: duration - n, type: 'beep', count: n }));
}

function sortEvents(events) {
  // Stable sort by time; ties keep insertion order (bell before speech, etc.).
  return events.map((e, i) => [e, i]).sort((a, b) => a[0].at - b[0].at || a[1] - b[1]).map(([e]) => e);
}

function scaleBlocks(list, duration) {
  const total = list.reduce((s, blk) => s + blk.seconds, 0);
  const factor = total > 0 ? duration / total : 1;
  let cursor = 0;
  return list.map((blk) => {
    const start = cursor;
    cursor += blk.seconds * factor;
    return { ...blk, start: Math.round(start * 10) / 10, end: Math.round(cursor * 10) / 10 };
  });
}

function scheduleCombos({ pool, rng, from, to, reserved, pace, level, stance }) {
  const out = [];
  const pick = createComboPicker(pool, rng);
  const extra = EXTRA_PER_STRIKE[level] ?? 0.5;
  // Small jitter keeps the rhythm natural without breaking the pace.
  let t = from + 0.5;
  let guard = 0;
  while (t < to - 3 && guard++ < 1000) {
    const combo = pick();
    const text = spokenCombo(combo.ids, stance);
    const speech = estimateSpeechSeconds(text);
    const end = t + speech;
    const clash = overlaps(t, end, reserved);
    if (clash) {
      t = clash[1] + 0.8;
      continue;
    }
    if (end > to - 3.2) break;
    out.push({ at: round1(t), type: 'combo', key: combo.key, ids: combo.ids, text });
    const gap = pace + Math.max(0, combo.ids.length - 3) * extra + (rng() - 0.5) * 0.6;
    t += Math.max(gap, speech + 0.8);
  }
  return out;
}

function scheduleTips({ tips, rng, to, reserved }) {
  const out = [];
  const order = [...tips].sort(() => rng() - 0.5);
  let t = 8;
  let i = 0;
  while (t < to - 6 && order.length > 0) {
    const text = order[i % order.length];
    const clash = overlaps(t, t + estimateSpeechSeconds(text), reserved);
    if (clash) {
      t = clash[1] + 1;
      continue;
    }
    out.push(say(round1(t), text, 'tip'));
    i++;
    t += 18 + rng() * 6;
  }
  return out;
}

const round1 = (n) => Math.round(n * 10) / 10;

// ── Engine ───────────────────────────────────────────────────────────────

export function initialEngineState() {
  return { segIndex: 0, elapsed: 0, eventIdx: 0, finished: false };
}

/**
 * Advance the engine by `dt` seconds. Pure: returns the next state and the
 * events that became due (each tagged with `late` = seconds behind schedule).
 */
export function advance(session, state, dt) {
  if (state.finished) return { state, fired: [] };
  let { segIndex, elapsed, eventIdx } = state;
  let finished = false;
  elapsed += dt;
  const fired = [];

  for (let guard = 0; guard < 10000; guard++) {
    const seg = session.segments[segIndex];
    while (eventIdx < seg.events.length && seg.events[eventIdx].at <= elapsed) {
      const ev = seg.events[eventIdx];
      fired.push({ ...ev, segIndex, late: elapsed - ev.at });
      eventIdx++;
    }
    if (elapsed < seg.duration) break;
    // Segment finished (flush any remaining events scheduled at the end).
    while (eventIdx < seg.events.length) {
      const ev = seg.events[eventIdx++];
      fired.push({ ...ev, segIndex, late: elapsed - ev.at });
    }
    elapsed -= seg.duration;
    segIndex++;
    eventIdx = 0;
    if (segIndex >= session.segments.length) {
      finished = true;
      segIndex = session.segments.length - 1;
      elapsed = session.segments[segIndex].duration;
      eventIdx = session.segments[segIndex].events.length;
      fired.push({ type: 'finish', segIndex, late: 0 });
      break;
    }
    fired.push({ type: 'segment', segIndex, late: elapsed });
  }
  return { state: { segIndex, elapsed, eventIdx, finished }, fired };
}

/** Jump to the start of the next segment (used to skip prep or rest). */
export function skipSegment(session, state) {
  const next = state.segIndex + 1;
  if (next >= session.segments.length) return { ...state };
  return { segIndex: next, elapsed: 0, eventIdx: 0, finished: false };
}

/** Seconds of the session completed so far. */
export function elapsedTotal(session, state) {
  let total = 0;
  for (let i = 0; i < state.segIndex; i++) total += session.segments[i].duration;
  return total + state.elapsed;
}

/** Number of rounds fully completed. */
export function roundsCompleted(session, state) {
  let count = 0;
  session.segments.forEach((seg, i) => {
    if (seg.kind !== 'round') return;
    if (i < state.segIndex || (i === state.segIndex && state.finished)) count++;
  });
  return count;
}
