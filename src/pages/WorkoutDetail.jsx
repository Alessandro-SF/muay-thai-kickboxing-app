import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Play, Clock, Repeat, Dumbbell, Target, Timer, Coffee } from 'lucide-react';
import { WORKOUT_BY_ID } from '../data/workouts';
import { CATEGORY_BY_ID, DISCIPLINES } from '../data/categories';
import CategoryIcon from '../components/CategoryIcon';
import LevelBadge from '../components/LevelBadge';
import AudioSettings from '../components/AudioSettings';
import { useAppData } from '../hooks/useAppData';
import { setPreferences } from '../lib/storage';
import { describeSeconds } from '../lib/session';
import NotFound from './NotFound';

const fmt = (s) => (s % 60 === 0 ? `${s / 60}:00` : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`);

export default function WorkoutDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { preferences } = useAppData();
  const workout = WORKOUT_BY_ID[id];
  if (!workout) return <NotFound message="That workout doesn't exist." />;
  const category = CATEGORY_BY_ID[workout.category];
  const kickboxing = workout.discipline === 'kickboxing';

  const start = () => {
    const q = new URLSearchParams({ stance: preferences.stance, audio: preferences.audio ? '1' : '0' });
    navigate(`/play/${workout.id}?${q}`);
  };

  return (
    <div className="container-page py-6 sm:py-10">
      <Link to="/workouts" className="btn btn-ghost -ml-3 py-2 text-sm"><ArrowLeft className="h-4 w-4" aria-hidden="true" /> All workouts</Link>

      <div className="mt-4 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-flame-400">
              <CategoryIcon name={category.icon} className="h-4 w-4" aria-hidden="true" /> {category.name}
            </span>
            <LevelBadge level={workout.level} />
            <span className="rounded-full border border-white/10 px-2.5 py-1 text-xs font-semibold text-white/70">{DISCIPLINES[workout.discipline].name}</span>
          </div>
          <h1 className="heading-xl mt-4">{workout.title}</h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-white/70">{workout.description}</p>

          <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { icon: Clock, label: 'Duration', value: `${workout.duration} min` },
              { icon: Repeat, label: 'Rounds', value: workout.rounds.length },
              { icon: Timer, label: 'Round', value: describeSeconds(workout.roundSeconds) },
              { icon: Coffee, label: 'Rest', value: describeSeconds(workout.restSeconds) },
            ].map((s) => (
              <div key={s.label} className="card p-4">
                <dt className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-white/45 uppercase"><s.icon className="h-3.5 w-3.5" aria-hidden="true" /> {s.label}</dt>
                <dd className="mt-1 font-display text-xl font-semibold tracking-wide">{s.value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="card p-5">
              <p className="flex items-center gap-2 text-sm font-semibold"><Target className="h-4 w-4 text-brand-400" aria-hidden="true" /> Training focus</p>
              <p className="mt-2 text-white/70">{workout.focus}</p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {workout.objectives?.map((o) => <li key={o} className="rounded-full bg-white/5 px-3 py-1 text-xs text-white/70">{o}</li>)}
              </ul>
            </div>
            <div className="card p-5">
              <p className="flex items-center gap-2 text-sm font-semibold"><Dumbbell className="h-4 w-4 text-brand-400" aria-hidden="true" /> Recommended equipment</p>
              <ul className="mt-2 space-y-1 text-white/70">
                {workout.equipment.map((e) => <li key={e}>{e}</li>)}
              </ul>
              {kickboxing && <p className="mt-3 text-xs text-white/45">Kickboxing rules: no elbows and no extended clinch work.</p>}
            </div>
          </div>

          <h2 className="mt-10 font-display text-2xl font-bold tracking-wide uppercase">Round by round</h2>
          <ol className="mt-4 grid gap-2">
            {workout.rounds.map((r, i) => (
              <li key={i} className="card flex gap-4 p-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/5 font-display text-lg font-bold text-brand-300">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                    <p className="font-semibold">{r.title}</p>
                    <p className="text-xs text-white/45">{fmt(r.seconds ?? workout.roundSeconds)} · {r.mode === 'combos' ? 'Called combinations' : r.mode === 'tips' ? 'Freestyle + coaching tips' : 'Timed intervals'}</p>
                  </div>
                  <p className="mt-1 text-sm text-white/60">
                    {r.mode === 'blocks' ? r.blocks.map((b) => `${b.label} (${b.seconds}s)`).join(' → ') : r.instruction}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card p-5 sm:p-6">
            <h2 className="font-display text-xl font-bold tracking-wide uppercase">Session settings</h2>
            <div className="mt-5">
              <AudioSettings prefs={preferences} onChange={setPreferences} />
            </div>
            <button type="button" onClick={start} className="btn btn-primary mt-6 w-full py-4 text-lg" data-testid="detail-start">
              <Play className="h-5 w-5 fill-current" aria-hidden="true" /> Start Workout
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
