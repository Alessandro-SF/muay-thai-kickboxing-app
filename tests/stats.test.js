import { describe, it, expect, beforeEach } from 'vitest';
import { computeStats } from '../src/lib/stats';
import { loadData, startSessionRecord, updateSessionRecord, _resetCache, clearHistory } from '../src/lib/storage';

const at = (iso, extra = {}) => ({ startedAt: iso, endedAt: iso, updatedAt: iso, elapsedSeconds: 600, roundsCompleted: 3, status: 'completed', ...extra });

describe('stats', () => {
  it('returns an empty state for new users', () => {
    const s = computeStats([]);
    expect(s.hasData).toBe(false);
    expect(s.completedWorkouts).toBe(0);
    expect(s.totalMinutes).toBe(0);
    expect(s.currentStreak).toBe(0);
  });

  it('distinguishes started vs completed and computes streaks', () => {
    const now = new Date('2026-05-10T18:00:00');
    const sessions = [
      at('2026-05-10T09:00:00'),
      at('2026-05-09T09:00:00'),
      at('2026-05-08T09:00:00', { status: 'ended-early', roundsCompleted: 1, elapsedSeconds: 120 }),
      at('2026-05-07T09:00:00'),
      at('2026-05-06T09:00:00'),
      at('2026-05-05T09:00:00'),
    ];
    const s = computeStats(sessions, now);
    expect(s.completedWorkouts).toBe(5);
    expect(s.unfinished).toBe(1);
    expect(s.currentStreak).toBe(2);
    expect(s.bestStreak).toBe(3);
    expect(s.totalRounds).toBe(16);
    expect(s.totalMinutes).toBe(52);
    expect(s.week).toHaveLength(7);
  });
});

describe('storage', () => {
  beforeEach(() => {
    localStorage.clear();
    _resetCache();
  });

  it('records a started then completed session', () => {
    const id = startSessionRecord({ workoutId: 'x', title: 'X', discipline: 'muay-thai', level: 'beginner', plannedSeconds: 300, totalRounds: 3 });
    expect(loadData().sessions[0].status).toBe('in-progress');
    updateSessionRecord(id, { status: 'completed', elapsedSeconds: 300, roundsCompleted: 3 });
    const rec = loadData().sessions[0];
    expect(rec.status).toBe('completed');
    expect(rec.endedAt).toBeTruthy();
    _resetCache();
    expect(loadData().sessions[0].id).toBe(id); // persisted
    clearHistory();
    expect(loadData().sessions).toHaveLength(0);
  });

  it('survives corrupted storage', () => {
    localStorage.setItem('thaicoach:v1', '{not json');
    _resetCache();
    expect(loadData().sessions).toEqual([]);
  });
});
