/**
 * Local persistence for progress and preferences.
 *
 * Everything lives under one versioned key so it can later be migrated or synced
 * to a cloud account: each session record has a stable `id`, timestamps and a
 * `syncedAt` field (null until a sync backend exists).
 */

const KEY = 'thaicoach:v1';
export const SCHEMA_VERSION = 1;

export const DEFAULT_PREFERENCES = {
  stance: 'orthodox',
  audio: true,
  voiceURI: '',
  voiceRate: 1.05,
  volume: 1,
  sounds: true,
};

const listeners = new Set();
let cache = null;

function uid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function emptyData() {
  return {
    schemaVersion: SCHEMA_VERSION,
    profile: { id: uid(), createdAt: new Date().toISOString() },
    sessions: [],
    preferences: { ...DEFAULT_PREFERENCES },
  };
}

function safeStorage() {
  try {
    const s = window.localStorage;
    const probe = '__thaicoach_probe__';
    s.setItem(probe, '1');
    s.removeItem(probe);
    return s;
  } catch {
    return null;
  }
}

export function loadData() {
  if (cache) return cache;
  const storage = safeStorage();
  let data = null;
  if (storage) {
    try {
      const raw = storage.getItem(KEY);
      if (raw) data = JSON.parse(raw);
    } catch {
      data = null; // corrupted JSON → start fresh rather than crash
    }
  }
  if (!data || typeof data !== 'object' || !Array.isArray(data.sessions)) data = emptyData();
  data.preferences = { ...DEFAULT_PREFERENCES, ...(data.preferences || {}) };
  data.profile = data.profile || emptyData().profile;
  data.schemaVersion = SCHEMA_VERSION;
  cache = data;
  return cache;
}

function save(next) {
  cache = next;
  const storage = safeStorage();
  if (storage) {
    try {
      storage.setItem(KEY, JSON.stringify(next));
    } catch {
      // Quota exceeded or private mode: keep working in memory.
    }
  }
  listeners.forEach((fn) => fn());
}

export function subscribe(fn) {
  listeners.add(fn);
  const onStorage = (e) => {
    if (e.key === KEY) {
      cache = null;
      fn();
    }
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(fn);
    window.removeEventListener('storage', onStorage);
  };
}

export function getSnapshot() {
  return loadData();
}

// ── Sessions ─────────────────────────────────────────────

/** Record that a workout was started. Returns the new session id. */
export function startSessionRecord(meta) {
  const data = loadData();
  const now = new Date().toISOString();
  const record = {
    id: uid(),
    workoutId: meta.workoutId,
    title: meta.title,
    category: meta.category ?? null,
    discipline: meta.discipline,
    level: meta.level,
    custom: !!meta.custom,
    stance: meta.stance ?? 'orthodox',
    startedAt: now,
    updatedAt: now,
    endedAt: null,
    status: 'in-progress',
    plannedSeconds: meta.plannedSeconds,
    elapsedSeconds: 0,
    roundsCompleted: 0,
    totalRounds: meta.totalRounds,
    syncedAt: null,
  };
  save({ ...data, sessions: [record, ...data.sessions].slice(0, 500) });
  return record.id;
}

/** Update progress for a session (status: 'in-progress' | 'completed' | 'ended-early'). */
export function updateSessionRecord(id, patch) {
  const data = loadData();
  const now = new Date().toISOString();
  const sessions = data.sessions.map((s) => {
    if (s.id !== id) return s;
    const next = { ...s, ...patch, updatedAt: now };
    if (patch.status && patch.status !== 'in-progress' && !s.endedAt) next.endedAt = now;
    return next;
  });
  save({ ...data, sessions });
}

export function clearHistory() {
  const data = loadData();
  save({ ...data, sessions: [] });
}

// ── Preferences ──────────────────────────────────────────

export function getPreferences() {
  return loadData().preferences;
}

export function setPreferences(patch) {
  const data = loadData();
  save({ ...data, preferences: { ...data.preferences, ...patch } });
}

/** Test helper: drop the in-memory cache. */
export function _resetCache() {
  cache = null;
}
