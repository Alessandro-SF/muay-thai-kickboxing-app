import { Link } from 'react-router-dom';
import { Play, Phone, ArrowRight, Volume2, Timer, Layers, Headphones, MessageSquare, Flame, Trophy, Repeat, Clock, Zap } from 'lucide-react';
import HeroArt from '../components/HeroArt';
import WorkoutCard from '../components/WorkoutCard';
import CategoryIcon from '../components/CategoryIcon';
import StatCard from '../components/StatCard';
import { CallCoachButton, PhonePanel } from '../components/CallCoach';
import { WORKOUTS, WORKOUT_BY_ID, FEATURED_WORKOUT_IDS } from '../data/workouts';
import { CATEGORIES } from '../data/categories';
import { useAppData } from '../hooks/useAppData';
import { computeStats } from '../lib/stats';
import { APP, COACH } from '../config';

export default function Home() {
  const data = useAppData();
  const stats = computeStats(data.sessions);
  const featured = FEATURED_WORKOUT_IDS.map((id) => WORKOUT_BY_ID[id]);

  return (
    <div>
      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
        <div className="absolute -top-40 left-1/2 h-96 w-[48rem] -translate-x-1/2 rounded-full bg-brand-600/20 blur-3xl" />
        <div className="container-page relative grid items-center gap-8 py-10 sm:py-16 lg:grid-cols-[1.1fr_1fr] lg:py-20">
          <div className="animate-fade-up">
            <p className="eyebrow">Muay Thai · Kickboxing · Live AI Coaching</p>
            <h1 className="heading-xl mt-4">
              Train Smarter.
              <br />
              <span className="text-gradient">Strike Better.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/70">
              Follow guided workouts with spoken combinations, round timers and rest periods — or call your real-time AI coach and train with a
              voice in your ear.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/workouts" className="btn btn-primary px-7 py-4 text-lg" data-testid="start-training">
                <Play className="h-5 w-5 fill-current" aria-hidden="true" /> Start Training
              </Link>
              <a href={COACH.telHref} className="btn btn-secondary px-7 py-4 text-lg" data-testid="hero-call">
                <Phone className="h-5 w-5 text-brand-400" aria-hidden="true" /> Call Thai Coach
              </a>
            </div>
            <dl className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-sm text-white/60">
              <div>
                <dt className="sr-only">Workouts</dt>
                <dd><span className="font-display text-2xl font-bold text-white">{WORKOUTS.length}</span> guided workouts</dd>
              </div>
              <div>
                <dt className="sr-only">Categories</dt>
                <dd><span className="font-display text-2xl font-bold text-white">{CATEGORIES.length}</span> categories</dd>
              </div>
              <div>
                <dt className="sr-only">Levels</dt>
                <dd><span className="font-display text-2xl font-bold text-white">3</span> skill levels</dd>
              </div>
            </dl>
          </div>
          <div className="relative mx-auto w-full max-w-md lg:max-w-none animate-pop">
            <HeroArt className="w-full drop-shadow-[0_30px_60px_rgba(229,52,26,0.25)]" />
            <div className="card absolute bottom-4 left-0 hidden max-w-[16rem] p-4 backdrop-blur sm:block">
              <p className="flex items-center gap-2 text-xs font-semibold text-white/50 uppercase"><Volume2 className="h-4 w-4 text-brand-400" aria-hidden="true" /> Coach calls</p>
              <p className="mt-1 font-display text-xl font-semibold tracking-wide">Jab, cross, left kick.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Two ways to train ───────────────────────────── */}
      <section className="container-page py-10 sm:py-14">
        <div className="grid gap-5 md:grid-cols-2">
          <div className="card relative overflow-hidden p-6 sm:p-8">
            <div className="absolute -top-20 -right-16 h-48 w-48 rounded-full bg-flame-500/15 blur-3xl" />
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-flame-500/15 text-flame-400"><Timer className="h-6 w-6" aria-hidden="true" /></span>
            <h2 className="mt-5 font-display text-2xl font-bold tracking-wide uppercase">Guided Workouts</h2>
            <p className="mt-2 text-white/65">
              Ready-made sessions with spoken combinations, a big round timer, rest periods and progress tracking. Pick a workout and press start.
            </p>
            <ul className="mt-5 grid gap-2 text-sm text-white/70">
              <li className="flex gap-2"><Volume2 className="h-4 w-4 text-flame-400" aria-hidden="true" /> Combinations called out loud (synthesized voice)</li>
              <li className="flex gap-2"><Layers className="h-4 w-4 text-flame-400" aria-hidden="true" /> Beginner to advanced, 5 to 45 minutes</li>
              <li className="flex gap-2"><Zap className="h-4 w-4 text-flame-400" aria-hidden="true" /> Quick Training builds a session from your settings</li>
            </ul>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/workouts" className="btn btn-primary">Browse workouts <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
              <Link to="/quick" className="btn btn-secondary">Quick Training</Link>
            </div>
          </div>
          <div className="card relative overflow-hidden border-brand-500/30 bg-gradient-to-br from-brand-700/25 to-ink-850 p-6 sm:p-8">
            <div className="absolute -top-20 -right-16 h-48 w-48 rounded-full bg-brand-500/25 blur-3xl" />
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500/20 text-brand-300"><Headphones className="h-6 w-6" aria-hidden="true" /></span>
            <h2 className="mt-5 font-display text-2xl font-bold tracking-wide uppercase">Live AI Coach</h2>
            <p className="mt-2 text-white/70">
              Call Thai Coach and train with a real-time AI coach over the phone. Get combinations, guidance and personalized practice whenever you're
              ready.
            </p>
            <a href={COACH.telHref} className="mt-5 block font-display text-3xl font-bold tracking-wide hover:text-brand-300">{COACH.phoneDisplay}</a>
            <div className="mt-6 flex flex-wrap gap-3">
              <CallCoachButton />
              <Link to="/ai-coach" className="btn btn-secondary">How it works</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Progress ────────────────────────────────────── */}
      <section className="container-page py-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Your training</p>
            <h2 className="heading-lg mt-2">Progress</h2>
          </div>
          {stats.hasData && <Link to="/progress" className="btn btn-ghost text-sm">View all <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>}
        </div>
        {stats.hasData ? (
          <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <StatCard icon={Trophy} label="Completed" value={stats.completedWorkouts} hint="workouts finished" />
            <StatCard icon={Clock} label="Minutes" value={stats.totalMinutes} hint="time trained" accent="text-flame-400" />
            <StatCard icon={Repeat} label="Rounds" value={stats.totalRounds} hint="rounds completed" accent="text-sky-400" />
            <StatCard icon={Flame} label="Streak" value={`${stats.currentStreak}d`} hint={`best ${stats.bestStreak} days`} accent="text-amber-400" />
          </div>
        ) : (
          <div className="card mt-5 flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold">No workouts logged yet.</p>
              <p className="mt-1 text-sm text-white/60">Finish your first guided session and your minutes, rounds and streak will appear here.</p>
            </div>
            <Link to="/workouts/shadow-warmup-5" className="btn btn-primary shrink-0">
              <Play className="h-4 w-4 fill-current" aria-hidden="true" /> Try a 5-minute warm-up
            </Link>
          </div>
        )}
      </section>

      {/* ── Featured workouts ───────────────────────────── */}
      <section className="container-page py-10 sm:py-14">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Featured</p>
            <h2 className="heading-lg mt-2">Start here</h2>
          </div>
          <Link to="/workouts" className="btn btn-ghost text-sm">All workouts <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
        </div>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {featured.map((w, i) => (
            <WorkoutCard key={w.id} workout={w} index={i} />
          ))}
        </div>
      </section>

      {/* ── Categories ──────────────────────────────────── */}
      <section className="container-page py-6 sm:py-10">
        <p className="eyebrow">Categories</p>
        <h2 className="heading-lg mt-2">Train every weapon</h2>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {CATEGORIES.map((c) => {
            const count = WORKOUTS.filter((w) => w.category === c.id).length;
            return (
              <Link
                key={c.id}
                to={`/workouts?category=${c.id}`}
                className="card group p-4 transition hover:border-brand-500/40 hover:bg-ink-800"
                data-testid="category-link"
              >
                <CategoryIcon name={c.icon} className="h-6 w-6 text-brand-400 transition group-hover:scale-110" aria-hidden="true" />
                <p className="mt-3 text-sm leading-snug font-semibold">{c.name}</p>
                <p className="mt-1 text-xs text-white/45">{count} {count === 1 ? 'workout' : 'workouts'}</p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── AI coach explainer ──────────────────────────── */}
      <section className="container-page py-12 sm:py-16">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="eyebrow">Thai Coach — Live AI Training</p>
            <h2 className="heading-lg mt-2">Your personal Muay Thai coach. One call away.</h2>
            <ol className="mt-6 grid gap-4">
              {[
                { icon: Phone, title: 'Call the number', text: 'Dial Thai Coach from any phone. Put it on speaker or use earbuds.' },
                { icon: MessageSquare, title: 'Tell the coach about you', text: 'Share your level, your equipment and what you want to work on.' },
                { icon: Headphones, title: 'Train in real time', text: 'Your AI coach talks you through combinations and guidance as you train.' },
              ].map((step, i) => (
                <li key={step.title} className="flex gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-500/15 font-display text-lg font-bold text-brand-300">{i + 1}</span>
                  <div>
                    <p className="font-semibold">{step.title}</p>
                    <p className="text-sm text-white/60">{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>
            <Link to="/ai-coach" className="btn btn-ghost mt-6 -ml-3">Learn more about the AI coach <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
          </div>
          <PhonePanel />
        </div>
      </section>

      {/* ── Quick training CTA ──────────────────────────── */}
      <section className="container-page pb-16">
        <div className="card relative overflow-hidden bg-gradient-to-r from-ink-800 to-ink-850 p-6 sm:p-10">
          <div className="bg-grid absolute inset-0 opacity-50" />
          <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-display text-3xl font-bold tracking-wide uppercase">Short on time? Build your own round.</h2>
              <p className="mt-2 max-w-xl text-white/65">
                Pick Muay Thai or Kickboxing, your level, rounds and focus. {APP.name} generates a structured session that stays consistent from bell to
                bell.
              </p>
            </div>
            <Link to="/quick" className="btn btn-primary shrink-0 px-7 py-4 text-lg"><Zap className="h-5 w-5" aria-hidden="true" /> Quick Training</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
