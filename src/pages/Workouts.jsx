import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, X, Search } from 'lucide-react';
import WorkoutCard from '../components/WorkoutCard';
import { WORKOUTS } from '../data/workouts';
import { CATEGORIES, CATEGORY_BY_ID, DURATIONS, LEVEL_INFO } from '../data/categories';

const DISCIPLINE_OPTIONS = [
  { value: '', label: 'All styles' },
  { value: 'muay-thai', label: 'Muay Thai' },
  { value: 'kickboxing', label: 'Kickboxing' },
];

function ChipRow({ label, children }) {
  return (
    <div>
      <p className="mb-2 text-xs font-bold tracking-wider text-white/45 uppercase">{label}</p>
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">{children}</div>
    </div>
  );
}

export default function Workouts() {
  const [params, setParams] = useSearchParams();
  const category = CATEGORY_BY_ID[params.get('category')] ? params.get('category') : '';
  const level = LEVEL_INFO[params.get('level')] ? params.get('level') : '';
  const duration = DURATIONS.includes(Number(params.get('duration'))) ? Number(params.get('duration')) : 0;
  const discipline = ['muay-thai', 'kickboxing'].includes(params.get('style')) ? params.get('style') : '';
  const query = params.get('q') ?? '';

  const update = (key, value) => {
    const next = new URLSearchParams(params);
    if (value === '' || value === 0 || value === null || next.get(key) === String(value)) next.delete(key);
    else next.set(key, String(value));
    setParams(next, { replace: true });
  };

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return WORKOUTS.filter(
      (w) =>
        (!category || w.category === category) &&
        (!level || w.level === level) &&
        (!duration || w.duration === duration) &&
        (!discipline || w.discipline === discipline) &&
        (!q || `${w.title} ${w.description} ${w.focus}`.toLowerCase().includes(q)),
    );
  }, [category, level, duration, discipline, query]);

  const activeCount = [category, level, duration, discipline, query].filter(Boolean).length;

  return (
    <div className="container-page py-8 sm:py-12">
      <p className="eyebrow">Guided workout library</p>
      <h1 className="heading-xl mt-3">Workouts</h1>
      <p className="mt-3 max-w-2xl text-white/65">
        Every workout is playable: spoken combinations, round and rest timers, and progress tracking. Filter by difficulty, type and length.
      </p>

      <div className="card mt-8 grid grid-cols-[minmax(0,1fr)] gap-5 p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="relative flex-1">
            <span className="sr-only">Search workouts</span>
            <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-white/40" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(e) => update('q', e.target.value)}
              placeholder="Search workouts…"
              className="w-full rounded-xl border border-white/10 bg-ink-900 py-3 pr-4 pl-10 text-sm placeholder:text-white/35 focus:border-brand-500 focus:outline-none"
            />
          </label>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Style">
            {DISCIPLINE_OPTIONS.map((o) => (
              <button key={o.value} type="button" onClick={() => update('style', o.value)} className={`chip ${discipline === o.value ? 'chip-active' : ''}`} aria-pressed={discipline === o.value}>
                {o.label}
              </button>
            ))}
          </div>
        </div>
        <ChipRow label="Difficulty">
          <button type="button" className={`chip ${!level ? 'chip-active' : ''}`} onClick={() => update('level', '')} aria-pressed={!level}>All levels</button>
          {Object.values(LEVEL_INFO).map((l) => (
            <button key={l.id} type="button" className={`chip ${level === l.id ? 'chip-active' : ''}`} onClick={() => update('level', l.id)} aria-pressed={level === l.id} data-testid={`filter-level-${l.id}`}>
              {l.name}
            </button>
          ))}
        </ChipRow>
        <ChipRow label="Workout type">
          <button type="button" className={`chip ${!category ? 'chip-active' : ''}`} onClick={() => update('category', '')} aria-pressed={!category}>All types</button>
          {CATEGORIES.map((c) => (
            <button key={c.id} type="button" className={`chip ${category === c.id ? 'chip-active' : ''}`} onClick={() => update('category', c.id)} aria-pressed={category === c.id}>
              {c.name}
            </button>
          ))}
        </ChipRow>
        <ChipRow label="Duration">
          <button type="button" className={`chip ${!duration ? 'chip-active' : ''}`} onClick={() => update('duration', 0)} aria-pressed={!duration}>Any length</button>
          {DURATIONS.map((d) => (
            <button key={d} type="button" className={`chip ${duration === d ? 'chip-active' : ''}`} onClick={() => update('duration', d)} aria-pressed={duration === d} data-testid={`filter-duration-${d}`}>
              {d} min
            </button>
          ))}
        </ChipRow>
      </div>

      <div className="mt-6 flex items-center justify-between gap-4">
        <p className="flex items-center gap-2 text-sm text-white/60" aria-live="polite" data-testid="result-count">
          <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
          {results.length} {results.length === 1 ? 'workout' : 'workouts'}
        </p>
        {activeCount > 0 && (
          <button type="button" className="btn btn-ghost py-2 text-sm" onClick={() => setParams(new URLSearchParams(), { replace: true })}>
            <X className="h-4 w-4" aria-hidden="true" /> Clear filters
          </button>
        )}
      </div>

      {results.length > 0 ? (
        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((w, i) => (
            <WorkoutCard key={w.id} workout={w} index={i} />
          ))}
        </div>
      ) : (
        <div className="card mt-5 p-10 text-center">
          <p className="font-semibold">No workouts match these filters.</p>
          <p className="mt-1 text-sm text-white/60">Try a different length or level — or build a custom session in Quick Training.</p>
          <div className="mt-5 flex justify-center gap-3">
            <button type="button" className="btn btn-secondary" onClick={() => setParams(new URLSearchParams(), { replace: true })}>Clear filters</button>
            <Link to="/quick" className="btn btn-primary">Quick Training</Link>
          </div>
        </div>
      )}
    </div>
  );
}
