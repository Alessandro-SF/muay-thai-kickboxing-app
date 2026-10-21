/** Derive progress statistics from stored session records. No invented data. */

export function dayKey(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

export function computeStats(sessions, now = new Date()) {
  const completed = sessions.filter((s) => s.status === 'completed');
  const totalSeconds = sessions.reduce((sum, s) => sum + (s.elapsedSeconds || 0), 0);
  const totalRounds = sessions.reduce((sum, s) => sum + (s.roundsCompleted || 0), 0);

  // Streaks count calendar days with at least one completed workout.
  const days = new Set(completed.map((s) => dayKey(s.endedAt || s.updatedAt || s.startedAt)));
  let current = 0;
  let cursor = new Date(now);
  if (!days.has(dayKey(cursor))) cursor = addDays(cursor, -1); // today not trained yet: streak still alive
  while (days.has(dayKey(cursor))) {
    current++;
    cursor = addDays(cursor, -1);
  }
  const sortedDays = [...days].sort();
  let best = 0;
  let run = 0;
  let prev = null;
  for (const k of sortedDays) {
    const d = new Date(`${k}T12:00:00`);
    run = prev && dayKey(addDays(prev, 1)) === k ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }

  // Last 7 days of training minutes (all sessions, completed or not).
  const week = [];
  for (let i = 6; i >= 0; i--) {
    const d = addDays(now, -i);
    const key = dayKey(d);
    const minutes = sessions
      .filter((s) => dayKey(s.startedAt) === key)
      .reduce((sum, s) => sum + (s.elapsedSeconds || 0) / 60, 0);
    week.push({ key, label: d.toLocaleDateString(undefined, { weekday: 'short' }), minutes: Math.round(minutes * 10) / 10 });
  }

  return {
    sessions: sessions.length,
    completedWorkouts: completed.length,
    unfinished: sessions.length - completed.length,
    totalMinutes: Math.round(totalSeconds / 60),
    totalRounds,
    currentStreak: current,
    bestStreak: best,
    week,
    hasData: sessions.length > 0,
  };
}
