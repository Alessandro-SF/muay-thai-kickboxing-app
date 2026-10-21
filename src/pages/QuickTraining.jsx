import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Play, Clock, Repeat, Timer, Coffee, Minus, Plus } from 'lucide-react';
import Segmented from '../components/Segmented';
import AudioSettings from '../components/AudioSettings';
import { DEFAULT_QUICK_CONFIG, QUICK_FOCUS_OPTIONS, buildCustomWorkout, roundsForDuration, sanitizeQuickConfig } from '../lib/customWorkout';
import { workoutTotalSeconds, describeSeconds } from '../lib/session';
import { newSeed } from '../lib/random';
import { DURATIONS } from '../data/categories';
import { useAppData } from '../hooks/useAppData';
import { setPreferences } from '../lib/storage';

const ROUND_OPTIONS = [60, 90, 120, 180, 240, 300];
const REST_OPTIONS = [0, 15, 30, 45, 60, 90, 120];
const QUICK_KEY = 'thaicoach:quick';

function loadSaved() {
  try {
    return JSON.parse(localStorage.getItem(QUICK_KEY) || 'null') || {};
  } catch {
    return {};
  }
}

function Stepper({ label, value, onChange, min, max, icon: Icon }) {
  return (
    <div>
      <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-white/80">{Icon && <Icon className="h-4 w-4 text-white/45" aria-hidden="true" />}{label}</p>
      <div className="flex items-center gap-3">
        <button type="button" className="btn btn-secondary h-12 w-12 p-0" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} aria-label={`Fewer ${label.toLowerCase()}`}>
          <Minus className="h-5 w-5" aria-hidden="true" />
        </button>
        <output className="min-w-12 text-center font-display text-3xl font-bold" aria-live="polite" data-testid="rounds-value">{value}</output>
        <button type="button" className="btn btn-secondary h-12 w-12 p-0" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} aria-label={`More ${label.toLowerCase()}`}>
          <Plus className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

export default function QuickTraining() {
  const navigate = useNavigate();
  const { preferences } = useAppData();
  const [config, setConfig] = useState(() => sanitizeQuickConfig({ ...DEFAULT_QUICK_CONFIG, stance: preferences.stance, audio: preferences.audio, ...loadSaved() }));
  const [targetMinutes, setTargetMinutes] = useState(null);

  const update = (patch) => {
    const next = sanitizeQuickConfig({ ...config, ...patch });
    if (targetMinutes && ('roundSeconds' in patch || 'restSeconds' in patch)) {
      next.rounds = roundsForDuration(targetMinutes, next.roundSeconds, next.restSeconds);
    }
    setConfig(next);
  };

  const pickDuration = (minutes) => {
    setTargetMinutes(minutes);
    setConfig(sanitizeQuickConfig({ ...config, rounds: roundsForDuration(minutes, config.roundSeconds, config.restSeconds) }));
  };

  const preview = useMemo(() => buildCustomWorkout(config), [config]);
  const totalSeconds = workoutTotalSeconds(preview);
  const focusOptions = QUICK_FOCUS_OPTIONS.filter((f) => !(f.muayThaiOnly && config.discipline === 'kickboxing'));

  const start = () => {
    try {
      localStorage.setItem(QUICK_KEY, JSON.stringify(config));
    } catch {
      /* ignore */
    }
    setPreferences({ stance: config.stance, audio: config.audio });
    const q = new URLSearchParams({
      discipline: config.discipline,
      level: config.level,
      roundSeconds: String(config.roundSeconds),
      restSeconds: String(config.restSeconds),
      rounds: String(config.rounds),
      focus: config.focus,
      stance: config.stance,
      audio: config.audio ? '1' : '0',
      seed: String(newSeed()),
    });
    navigate(`/play/quick?${q}`);
  };

  return (
    <div className="container-page py-8 sm:py-12">
      <p className="eyebrow">Quick Training</p>
      <h1 className="heading-xl mt-3">Build your session</h1>
      <p className="mt-3 max-w-2xl text-white/65">
        Choose your style and settings and start immediately. The full session is generated before the first bell, so it stays consistent from start
        to finish — even if you pause.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="card grid gap-7 p-5 sm:p-7">
          <Segmented
            label="Style"
            value={config.discipline}
            onChange={(v) => update({ discipline: v })}
            options={[
              { value: 'muay-thai', label: 'Muay Thai' },
              { value: 'kickboxing', label: 'Kickboxing' },
            ]}
          />
          <Segmented
            label="Difficulty"
            value={config.level}
            onChange={(v) => update({ level: v })}
            options={[
              { value: 'beginner', label: 'Beginner' },
              { value: 'intermediate', label: 'Intermediate' },
              { value: 'advanced', label: 'Advanced' },
            ]}
          />
          <fieldset>
            <legend className="mb-2 text-sm font-semibold text-white/80">Training focus</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {focusOptions.map((f) => {
                const active = config.focus === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => update({ focus: f.id })}
                    className={`rounded-xl border p-3.5 text-left transition ${active ? 'border-brand-500 bg-brand-500/10' : 'border-white/10 bg-white/[0.03] hover:border-white/25'}`}
                  >
                    <span className="block font-semibold">{config.discipline === 'muay-thai' && f.muayThaiLabel ? f.muayThaiLabel : f.name}</span>
                    <span className="mt-0.5 block text-xs text-white/55">{f.description}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="grid gap-7 border-t border-white/5 pt-7">
            <Segmented
              label="Workout duration (sets the number of rounds)"
              value={targetMinutes}
              onChange={pickDuration}
              options={DURATIONS.map((d) => ({ value: d, label: `${d} min` }))}
            />
            <Segmented label="Round length" value={config.roundSeconds} onChange={(v) => update({ roundSeconds: v })} options={ROUND_OPTIONS.map((s) => ({ value: s, label: s % 60 === 0 ? `${s / 60} min` : `${s}s` }))} />
            <Segmented label="Rest between rounds" value={config.restSeconds} onChange={(v) => update({ restSeconds: v })} options={REST_OPTIONS.map((s) => ({ value: s, label: s === 0 ? 'None' : s % 60 === 0 ? `${s / 60} min` : `${s}s` }))} />
            <Stepper
              label="Rounds"
              icon={Repeat}
              value={config.rounds}
              min={1}
              max={20}
              onChange={(v) => {
                setTargetMinutes(null);
                update({ rounds: v });
              }}
            />
          </div>

          <div className="border-t border-white/5 pt-7">
            <AudioSettings prefs={{ ...preferences, stance: config.stance, audio: config.audio }} onChange={(patch) => {
              const { stance, audio, ...rest } = patch;
              if (stance !== undefined || audio !== undefined) update({ ...(stance !== undefined && { stance }), ...(audio !== undefined && { audio }) });
              if (Object.keys(rest).length) setPreferences(rest);
            }} />
          </div>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card overflow-hidden">
            <div className="bg-gradient-to-br from-brand-700/40 to-ink-850 p-6">
              <p className="flex items-center gap-2 text-sm font-semibold text-flame-400"><Zap className="h-4 w-4" aria-hidden="true" /> Your session</p>
              <p className="mt-2 font-display text-3xl font-bold tracking-wide uppercase">{preview.title}</p>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div><dt className="flex items-center gap-1.5 text-white/50"><Clock className="h-4 w-4" aria-hidden="true" /> Total</dt><dd className="font-display text-2xl font-semibold" data-testid="quick-total">{Math.round(totalSeconds / 60)} min</dd></div>
                <div><dt className="flex items-center gap-1.5 text-white/50"><Repeat className="h-4 w-4" aria-hidden="true" /> Rounds</dt><dd className="font-display text-2xl font-semibold">{config.rounds}</dd></div>
                <div><dt className="flex items-center gap-1.5 text-white/50"><Timer className="h-4 w-4" aria-hidden="true" /> Round</dt><dd className="font-semibold">{describeSeconds(config.roundSeconds)}</dd></div>
                <div><dt className="flex items-center gap-1.5 text-white/50"><Coffee className="h-4 w-4" aria-hidden="true" /> Rest</dt><dd className="font-semibold">{config.restSeconds ? describeSeconds(config.restSeconds) : 'None'}</dd></div>
              </dl>
            </div>
            <ol className="max-h-64 divide-y divide-white/5 overflow-y-auto px-6 text-sm">
              {preview.rounds.map((r, i) => (
                <li key={i} className="flex items-center gap-3 py-2.5">
                  <span className="w-6 font-display font-bold text-brand-300">{i + 1}</span>
                  <span className="text-white/80">{r.title}</span>
                </li>
              ))}
            </ol>
            <div className="p-6 pt-4">
              <button type="button" onClick={start} className="btn btn-primary w-full py-4 text-lg" data-testid="quick-start">
                <Play className="h-5 w-5 fill-current" aria-hidden="true" /> Start Training
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
