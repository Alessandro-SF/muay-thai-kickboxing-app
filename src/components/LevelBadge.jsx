import { LEVEL_INFO } from '../data/categories';

const COLORS = {
  beginner: 'text-emerald-300 border-emerald-400/30 bg-emerald-400/10',
  intermediate: 'text-flame-400 border-flame-400/30 bg-flame-400/10',
  advanced: 'text-brand-300 border-brand-400/40 bg-brand-500/15',
};

export default function LevelBadge({ level, className = '' }) {
  const info = LEVEL_INFO[level];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${COLORS[level]} ${className}`}>
      <span className="flex gap-0.5" aria-hidden="true">
        {[1, 2, 3].map((n) => (
          <span key={n} className={`h-1.5 w-1.5 rounded-full ${n <= info.dots ? 'bg-current' : 'bg-current opacity-25'}`} />
        ))}
      </span>
      {info.name}
    </span>
  );
}
