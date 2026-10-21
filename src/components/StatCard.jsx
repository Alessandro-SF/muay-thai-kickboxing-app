export default function StatCard({ icon: Icon, label, value, hint, accent = 'text-brand-400' }) {
  return (
    <div className="card p-4 sm:p-5">
      <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-white/50 uppercase">
        {Icon && <Icon className={`h-4 w-4 ${accent}`} aria-hidden="true" />}
        {label}
      </div>
      <div className="mt-2 font-display text-3xl font-bold tracking-wide sm:text-4xl">{value}</div>
      {hint && <div className="mt-1 text-xs text-white/45">{hint}</div>}
    </div>
  );
}
