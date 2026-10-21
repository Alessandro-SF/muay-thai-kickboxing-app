import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Clock, Repeat, Activity, Flame, Award, Trash2, Play, CircleCheck, Flag, CircleDashed } from 'lucide-react';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';
import StatCard from '../components/StatCard';
import LevelBadge from '../components/LevelBadge';
import { useAppData } from '../hooks/useAppData';
import { computeStats } from '../lib/stats';
import { clearHistory } from '../lib/storage';

const STATUS = {
  completed: { label: 'Completed', icon: CircleCheck, cls: 'text-emerald-300 bg-emerald-400/10 border-emerald-400/30' },
  'ended-early': { label: 'Ended early', icon: Flag, cls: 'text-amber-300 bg-amber-400/10 border-amber-400/30' },
  'in-progress': { label: 'Started — not finished', icon: CircleDashed, cls: 'text-white/70 bg-white/5 border-white/15' },
};

const fmtDuration = (sec) => {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return m > 0 ? `${m}m ${String(s).padStart(2, '0')}s` : `${s}s`;
};

export default function Progress() {
  const data = useAppData();
  const stats = computeStats(data.sessions);
  const [confirmClear, setConfirmClear] = useState(false);

  return (
    <div className="container-page py-8 sm:py-12">
      <p className="eyebrow">My Progress</p>
      <h1 className="heading-xl mt-3">Your training</h1>
      <p className="mt-3 max-w-2xl text-white/65">Stored privately in this browser. Nothing is uploaded — clearing your browser data also clears this history.</p>

      {!stats.hasData ? (
        <div className="card mt-8 flex flex-col items-center p-10 text-center sm:p-16" data-testid="progress-empty">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-500/15"><Activity className="h-8 w-8 text-brand-400" aria-hidden="true" /></span>
          <h2 className="mt-5 text-2xl font-bold">No training logged yet</h2>
          <p className="mt-2 max-w-md text-white/60">Start a guided workout and your sessions, minutes, rounds and streaks will be tracked here automatically.</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link to="/workouts" className="btn btn-primary"><Play className="h-4 w-4 fill-current" aria-hidden="true" /> Browse workouts</Link>
            <Link to="/quick" className="btn btn-secondary">Quick Training</Link>
          </div>
        </div>
      ) : (
        <>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6" data-testid="progress-stats">
            <StatCard icon={Trophy} label="Completed" value={stats.completedWorkouts} hint="workouts finished" />
            <StatCard icon={Activity} label="Sessions" value={stats.sessions} hint={`${stats.unfinished} not completed`} accent="text-white/60" />
            <StatCard icon={Clock} label="Minutes" value={stats.totalMinutes} hint="total time trained" accent="text-flame-400" />
            <StatCard icon={Repeat} label="Rounds" value={stats.totalRounds} hint="rounds completed" accent="text-sky-400" />
            <StatCard icon={Flame} label="Streak" value={stats.currentStreak} hint="days in a row" accent="text-amber-400" />
            <StatCard icon={Award} label="Best streak" value={stats.bestStreak} hint="days" accent="text-violet-400" />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
            <div className="card p-5 sm:p-6">
              <h2 className="font-display text-xl font-bold tracking-wide uppercase">Last 7 days</h2>
              <p className="text-sm text-white/50">Minutes trained per day</p>
              <div className="mt-4 h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.week} margin={{ top: 8, right: 4, left: -24, bottom: 0 }}>
                    <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                    <XAxis dataKey="label" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                      contentStyle={{ background: '#18181d', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff' }}
                      formatter={(v) => [`${v} min`, 'Trained']}
                    />
                    <Bar dataKey="minutes" fill="#ff4d2e" radius={[6, 6, 0, 0]} maxBarSize={36} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-display text-xl font-bold tracking-wide uppercase">Recent sessions</h2>
                {confirmClear ? (
                  <div className="flex items-center gap-2 text-sm">
                    <button type="button" className="btn btn-ghost px-3 py-1.5 text-sm" onClick={() => setConfirmClear(false)}>Cancel</button>
                    <button type="button" className="btn bg-red-600 px-3 py-1.5 text-sm hover:bg-red-500" onClick={() => { clearHistory(); setConfirmClear(false); }}>Delete all</button>
                  </div>
                ) : (
                  <button type="button" className="btn btn-ghost px-3 py-1.5 text-sm text-white/50" onClick={() => setConfirmClear(true)}>
                    <Trash2 className="h-4 w-4" aria-hidden="true" /> Clear
                  </button>
                )}
              </div>
              <ul className="mt-4 max-h-[26rem] divide-y divide-white/5 overflow-y-auto" data-testid="history">
                {data.sessions.slice(0, 30).map((s) => {
                  const st = STATUS[s.status] ?? STATUS['in-progress'];
                  return (
                    <li key={s.id} className="flex items-start justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{s.title}</p>
                        <p className="mt-0.5 text-xs text-white/45">
                          {new Date(s.startedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })} · {fmtDuration(s.elapsedSeconds || 0)} · {s.roundsCompleted}/{s.totalRounds} rounds
                        </p>
                        <div className="mt-1.5"><LevelBadge level={s.level} className="scale-90 origin-left" /></div>
                      </div>
                      <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-semibold ${st.cls}`}>
                        <st.icon className="h-3.5 w-3.5" aria-hidden="true" /> {st.label}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
