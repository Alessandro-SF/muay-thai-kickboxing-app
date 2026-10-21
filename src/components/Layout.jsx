import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { House, Dumbbell, Zap, Phone, ChartColumn } from 'lucide-react';
import Logo from './Logo';
import { CallCoachButton } from './CallCoach';
import { COACH, APP } from '../config';

export const NAV_ITEMS = [
  { to: '/', label: 'Home', icon: House, end: true },
  { to: '/workouts', label: 'Workouts', icon: Dumbbell },
  { to: '/quick', label: 'Quick Training', short: 'Quick', icon: Zap },
  { to: '/ai-coach', label: 'AI Coach', icon: Phone },
  { to: '/progress', label: 'My Progress', short: 'Progress', icon: ChartColumn },
];

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function Layout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <ScrollToTop />
      <header className="sticky top-0 z-40 border-b border-white/5 bg-ink-950/80 backdrop-blur-xl">
        <div className="container-page flex h-16 items-center justify-between gap-4">
          <Logo />
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `rounded-lg px-3.5 py-2 text-sm font-semibold transition ${isActive ? 'bg-white/10 text-white' : 'text-white/65 hover:text-white'}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <CallCoachButton size="sm" className="hidden sm:inline-flex" />
            <a href={COACH.telHref} className="btn btn-primary h-10 w-10 p-0 sm:hidden" aria-label={`Call Thai Coach ${COACH.phoneDisplay}`}>
              <Phone className="h-5 w-5" aria-hidden="true" />
            </a>
          </div>
        </div>
      </header>

      <main className="flex-1 pb-24 lg:pb-0">
        <Outlet />
      </main>

      <footer className="hidden border-t border-white/5 bg-ink-900 lg:block">
        <div className="container-page flex flex-col gap-6 py-10 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <Logo />
            <p className="mt-3 text-sm text-white/55">{APP.tagline} Guided Muay Thai & Kickboxing workouts and a live AI coach you can call.</p>
          </div>
          <div className="text-sm text-white/55">
            <p className="font-semibold text-white">Live AI Coach</p>
            <a href={COACH.telHref} className="mt-1 block font-display text-xl tracking-wide text-white hover:text-brand-300">
              {COACH.phoneDisplay}
            </a>
            <p className="mt-1 max-w-xs text-xs">Standard calling rates may apply.</p>
          </div>
          <p className="max-w-sm text-xs leading-relaxed text-white/40">
            Train within your limits. Thai Coach provides general training guidance and is not a substitute for a qualified instructor or
            medical advice. Warm up properly and stop if you feel pain or dizziness.
          </p>
        </div>
      </footer>

      {/* Mobile bottom navigation */}
      <nav className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-ink-900/95 backdrop-blur-xl lg:hidden" aria-label="Main">
        <div className="mx-auto grid max-w-lg grid-cols-5">
          {NAV_ITEMS.map(({ to, label, short, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold transition ${isActive ? 'text-brand-400' : 'text-white/55'}`
              }
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              {short || label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
