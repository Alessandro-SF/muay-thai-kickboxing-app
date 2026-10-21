import { Link } from 'react-router-dom';
import { Clock, Repeat, Play, ChevronRight, Dumbbell } from 'lucide-react';
import { CATEGORY_BY_ID, DISCIPLINES } from '../data/categories';
import CategoryIcon from './CategoryIcon';
import LevelBadge from './LevelBadge';

const GRADIENTS = {
  beginner: 'from-emerald-500/25 via-ink-800 to-ink-850',
  intermediate: 'from-flame-500/30 via-ink-800 to-ink-850',
  advanced: 'from-brand-600/40 via-ink-800 to-ink-850',
};

export default function WorkoutCard({ workout, index = 0 }) {
  const category = CATEGORY_BY_ID[workout.category];
  return (
    <article
      className="card group flex flex-col overflow-hidden transition hover:-translate-y-1 hover:border-white/20 hover:shadow-2xl hover:shadow-black/50 animate-fade-up"
      style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
      data-testid="workout-card"
    >
      <Link to={`/workouts/${workout.id}`} className={`relative block bg-gradient-to-br ${GRADIENTS[workout.level]} p-5 pb-4`}>
        <div className="bg-grid absolute inset-0 opacity-60" />
        <div className="relative flex items-start justify-between gap-3">
          <span className="inline-flex items-center gap-2 rounded-lg bg-black/40 px-2.5 py-1.5 text-xs font-semibold text-white/85 backdrop-blur">
            <CategoryIcon name={category.icon} className="h-4 w-4 text-flame-400" aria-hidden="true" />
            {category.name}
          </span>
          <span className="rounded-lg bg-black/40 px-2.5 py-1.5 font-display text-sm font-semibold tracking-wide backdrop-blur">
            {workout.duration} MIN
          </span>
        </div>
        <h3 className="relative mt-6 font-display text-2xl leading-tight font-bold tracking-wide uppercase group-hover:text-brand-50">
          {workout.title}
        </h3>
        <p className="relative mt-1 text-sm text-white/60">{DISCIPLINES[workout.discipline].name} · {workout.focus}</p>
      </Link>

      <div className="flex flex-1 flex-col p-5 pt-4">
        <p className="line-clamp-3 text-sm leading-relaxed text-white/70">{workout.description}</p>
        <dl className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-white/70">
          <LevelBadge level={workout.level} />
          <div className="flex items-center gap-1.5">
            <Repeat className="h-4 w-4 text-white/40" aria-hidden="true" />
            <dt className="sr-only">Rounds</dt>
            <dd>{workout.rounds.length} rounds</dd>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-white/40" aria-hidden="true" />
            <dt className="sr-only">Duration</dt>
            <dd>{workout.duration} min</dd>
          </div>
        </dl>
        <p className="mt-3 flex items-start gap-1.5 text-xs text-white/50">
          <Dumbbell className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {workout.equipment.join(' · ')}
        </p>
        <div className="mt-auto flex gap-2 pt-5">
          <Link to={`/play/${workout.id}`} className="btn btn-primary flex-1 py-2.5" data-testid="start-workout">
            <Play className="h-4 w-4 fill-current" aria-hidden="true" /> Start Workout
          </Link>
          <Link to={`/workouts/${workout.id}`} className="btn btn-secondary px-3.5 py-2.5" aria-label={`Details for ${workout.title}`}>
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}
