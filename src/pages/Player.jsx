import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  X, Volume2, VolumeX, Play, Pause, RotateCcw, SkipForward, Flag, Trophy, Clock, Repeat, Zap, Phone, ArrowRight, Info,
} from 'lucide-react';
import { WORKOUT_BY_ID } from '../data/workouts';
import { TECHNIQUES, TECHNIQUE_TYPES } from '../data/techniques';
import { HAS_PRERECORDED_AUDIO } from '../data/audioManifest';
import { buildSession, elapsedTotal, roundsCompleted } from '../lib/session';
import { techniqueLabel } from '../lib/combos';
import { buildCustomWorkout, sanitizeQuickConfig } from '../lib/customWorkout';
import { newSeed } from '../lib/random';
import { VoiceCoach } from '../lib/audio';
import { startSessionRecord, updateSessionRecord, getPreferences } from '../lib/storage';
import { useWorkoutRunner } from '../hooks/useWorkoutRunner';
import { useWakeLock } from '../hooks/useWakeLock';
import LevelBadge from '../components/LevelBadge';
import { COACH } from '../config';
import NotFound from './NotFound';

const fmtClock = (sec) => {
  const s = Math.max(0, Math.ceil(sec - 1e-6));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

const CHIP_COLORS = {
  punch: 'bg-brand-500/20 border-brand-400/50 text-white',
  kick: 'bg-flame-500/20 border-flame-400/50 text-white',
  teep: 'bg-amber-400/15 border-amber-300/50 text-white',
  knee: 'bg-yellow-400/15 border-yellow-300/40 text-white',
  elbow: 'bg-rose-500/20 border-rose-400/50 text-white',
  defense: 'bg-sky-500/15 border-sky-400/50 text-white',
  footwork: 'bg-emerald-500/15 border-emerald-400/50 text-white',
  clinch: 'bg-violet-500/20 border-violet-400/50 text-white',
};

const PHASE_STYLE = {
  prep: { label: 'Get ready', ring: 'text-amber-400', pill: 'bg-amber-400/15 text-amber-300', bar: 'bg-amber-400' },
  round: { label: 'Fight', ring: 'text-brand-500', pill: 'bg-brand-500/20 text-brand-300', bar: 'bg-brand-500' },
  rest: { label: 'Rest', ring: 'text-sky-400', pill: 'bg-sky-400/15 text-sky-300', bar: 'bg-sky-400' },
};

/** Resolve the workout + options from the URL. */
function usePlayerSetup() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const prefs = getPreferences();
  return useMemo(() => {
    if (id === 'quick') {
      const config = sanitizeQuickConfig(Object.fromEntries(params));
      return {
        workout: buildCustomWorkout(config),
        stance: config.stance,
        audio: config.audio,
        seed: Number(params.get('seed')) || newSeed(),
      };
    }
    const workout = WORKOUT_BY_ID[id];
    if (!workout) return null;
    return {
      workout,
      stance: (params.get('stance') ?? prefs.stance) === 'southpaw' ? 'southpaw' : 'orthodox',
      audio: params.has('audio') ? params.get('audio') !== '0' : prefs.audio,
      seed: Number(params.get('seed')) || newSeed(),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);
}

export default function Player() {
  const setup = usePlayerSetup();
  if (!setup) return <NotFound message="That workout doesn't exist." />;
  return <PlayerScreen {...setup} />;
}

function PlayerScreen({ workout, stance, audio, seed }) {
  const navigate = useNavigate();
  const session = useMemo(() => buildSession(workout, { stance, seed }), [workout, stance, seed]);
  const coachRef = useRef(null);
  if (!coachRef.current) coachRef.current = new VoiceCoach();
  const coach = coachRef.current;

  const [audioOn, setAudioOn] = useState(audio);
  const [combo, setCombo] = useState(null);
  const [cue, setCue] = useState(null);
  const [blockIndex, setBlockIndex] = useState(0);
  const [comboCount, setComboCount] = useState(0);
  const [confirm, setConfirm] = useState(null); // 'finish' | 'restart' | 'exit'
  const [outcome, setOutcome] = useState(null); // 'completed' | 'ended-early'
  const recordRef = useRef(null);

  useEffect(() => {
    const p = getPreferences();
    coach.configure({ rate: p.voiceRate, volume: p.volume, voiceURI: p.voiceURI, sounds: p.sounds });
  }, [coach]);

  useEffect(() => {
    coach.setMuted(!audioOn);
  }, [audioOn, coach]);

  useEffect(() => () => coach.stop(), [coach]);

  const persist = useCallback(
    (state, status) => {
      if (!recordRef.current) return;
      updateSessionRecord(recordRef.current, {
        elapsedSeconds: Math.round(elapsedTotal(session, state)),
        roundsCompleted: roundsCompleted(session, state),
        ...(status ? { status } : {}),
      });
    },
    [session],
  );

  const handleEvents = useCallback(
    (fired, state) => {
      let speech = null;
      for (const ev of fired) {
        switch (ev.type) {
          case 'segment': {
            setCombo(null);
            setCue(null);
            setBlockIndex(0);
            if (ev.skipped) coach.stop();
            persist(state);
            break;
          }
          case 'combo':
            setCombo(ev);
            setComboCount((n) => n + 1);
            if (ev.late < 1.5) speech = ev.text;
            break;
          case 'say':
            setCue(ev);
            if (ev.late < 2) speech = ev.text;
            break;
          case 'block':
            setBlockIndex(ev.index);
            setCombo(null);
            break;
          case 'bell':
            if (ev.late < 1) coach.bell(ev.sound);
            break;
          case 'beep':
            if (ev.late < 0.6) coach.beep(ev.count);
            break;
          case 'finish':
            setOutcome('completed');
            persist(state, 'completed');
            break;
          default:
        }
      }
      // Only the most recent callout is spoken — never a backlog, never overlapping.
      if (speech) coach.speak(speech);
    },
    [coach, persist],
  );

  const runner = useWorkoutRunner(session, handleEvents);
  const { status, engine } = runner;
  useWakeLock(status === 'running');

  const seg = session.segments[engine.segIndex];
  const remaining = seg.duration - engine.elapsed;
  const phase = PHASE_STYLE[seg.kind];
  const overall = Math.min(1, elapsedTotal(session, engine) / session.totalSeconds);
  const segProgress = Math.min(1, engine.elapsed / seg.duration);
  const roundNumber = seg.roundIndex + 1;

  // Save progress when the page is hidden or closed mid-session.
  useEffect(() => {
    const save = () => {
      if (recordRef.current && !outcome) persist(runner.engineRef.current);
    };
    window.addEventListener('pagehide', save);
    return () => {
      window.removeEventListener('pagehide', save);
      save();
    };
  }, [persist, outcome, runner.engineRef]);

  const begin = () => {
    coach.unlock();
    if (!recordRef.current) {
      recordRef.current = startSessionRecord({
        workoutId: workout.id,
        title: workout.title,
        category: workout.category,
        discipline: workout.discipline,
        level: workout.level,
        custom: !!workout.custom,
        stance,
        plannedSeconds: session.totalSeconds,
        totalRounds: session.totalRounds,
      });
    }
    setOutcome(null);
    runner.start();
  };

  const togglePause = useCallback(() => {
    if (status === 'running') {
      runner.pause();
      coach.stop();
    } else if (status === 'paused') {
      coach.unlock();
      runner.resume();
    }
  }, [status, runner, coach]);

  const doRestart = () => {
    coach.stop();
    if (recordRef.current) {
      const elapsed = elapsedTotal(session, runner.engineRef.current);
      if (outcome) {
        recordRef.current = null; // already saved as completed / ended early
      } else if (elapsed >= 15) {
        persist(runner.engineRef.current, 'ended-early');
        recordRef.current = null;
      } else {
        updateSessionRecord(recordRef.current, { elapsedSeconds: 0, roundsCompleted: 0 });
      }
    }
    setCombo(null);
    setCue(null);
    setComboCount(0);
    setOutcome(null);
    setConfirm(null);
    runner.restart();
  };

  const doFinish = () => {
    coach.stop();
    runner.finishNow();
    if (!runner.engineRef.current.finished) {
      persist(runner.engineRef.current, 'ended-early');
      setOutcome('ended-early');
    }
    setConfirm(null);
  };

  const doExit = () => {
    coach.stop();
    if (status === 'running') runner.pause();
    navigate(workout.custom ? '/quick' : `/workouts/${workout.id}`);
  };

  // Keyboard shortcuts: space = pause/resume, M = mute.
  useEffect(() => {
    const onKey = (e) => {
      if (e.target instanceof HTMLInputElement || confirm) return;
      if (e.code === 'Space' && (status === 'running' || status === 'paused')) {
        e.preventDefault();
        togglePause();
      } else if (e.key === 'm' || e.key === 'M') {
        setAudioOn((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [status, togglePause, confirm]);

  // ── Screens ───────────────────────────────────────────
  if (status === 'ready') {
    return <ReadyScreen workout={workout} session={session} stance={stance} audioOn={audioOn} setAudioOn={setAudioOn} onStart={begin} onBack={doExit} />;
  }

  if (status === 'finished' && outcome) {
    return (
      <SummaryScreen
        workout={workout}
        outcome={outcome}
        seconds={elapsedTotal(session, engine)}
        rounds={roundsCompleted(session, engine)}
        totalRounds={session.totalRounds}
        combos={comboCount}
        onAgain={doRestart}
      />
    );
  }

  const block = seg.kind === 'round' && seg.blocks?.length ? seg.blocks[blockIndex] : null;
  const nextSeg = session.segments[engine.segIndex + 1];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-ink-950" data-testid="player">
      <div className={`pointer-events-none absolute inset-x-0 top-0 h-80 opacity-40 blur-3xl transition-colors duration-700 ${seg.kind === 'round' ? 'bg-brand-600/40' : seg.kind === 'rest' ? 'bg-sky-500/25' : 'bg-amber-400/25'}`} />

      {/* Top bar */}
      <header className="relative flex items-center justify-between gap-3 px-4 pt-[max(env(safe-area-inset-top),0.75rem)] pb-2 sm:px-6">
        <button type="button" onClick={() => setConfirm('exit')} className="btn btn-secondary h-12 w-12 p-0" aria-label="Exit workout">
          <X className="h-6 w-6" aria-hidden="true" />
        </button>
        <div className="min-w-0 text-center">
          <p className="truncate text-sm font-semibold text-white/80">{workout.title}</p>
          <p className="text-xs text-white/45">{stance === 'southpaw' ? 'Southpaw' : 'Orthodox'} · {fmtClock(session.totalSeconds - elapsedTotal(session, engine))} left</p>
        </div>
        <button
          type="button"
          onClick={() => setAudioOn((v) => !v)}
          className={`btn h-12 w-12 p-0 ${audioOn ? 'btn-secondary' : 'border border-amber-400/40 bg-amber-400/15 text-amber-300'}`}
          aria-label={audioOn ? 'Mute voice' : 'Unmute voice'}
          aria-pressed={!audioOn}
          data-testid="mute"
        >
          {audioOn ? <Volume2 className="h-6 w-6" aria-hidden="true" /> : <VolumeX className="h-6 w-6" aria-hidden="true" />}
        </button>
      </header>

      {/* Main */}
      <main className="relative flex flex-1 flex-col items-center justify-center-safe overflow-y-auto px-4 py-2 text-center">
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-bold tracking-[0.2em] uppercase ${phase.pill}`} data-testid="phase">
            {status === 'paused' ? 'Paused' : phase.label}
          </span>
          <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-bold tracking-[0.15em] text-white/70 uppercase" data-testid="round-indicator">
            Round {roundNumber} / {session.totalRounds}
          </span>
        </div>

        <div className="relative mt-4 flex items-center justify-center">
          <ProgressRing progress={segProgress} className={phase.ring} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p
              className={`font-display leading-none font-bold tabular-nums tracking-tight ${status === 'paused' ? 'animate-pulse text-white/50' : ''} text-[clamp(3.5rem,min(24vw,14dvh),9.5rem)]`}
              role="timer"
              aria-live="off"
              data-testid="timer"
            >
              {fmtClock(remaining)}
            </p>
            <p className="mt-1 max-w-[14rem] truncate text-sm font-semibold text-white/60">
              {seg.kind === 'round' ? (block ? block.label : seg.label) : seg.kind === 'rest' ? `Next: ${seg.next}` : `First: ${seg.next}`}
            </p>
          </div>
        </div>

        {/* Callout area */}
        <div className="mt-5 flex min-h-[7rem] w-full max-w-3xl flex-col items-center justify-start" aria-live="polite">
          {seg.kind === 'round' && combo ? (
            <ComboDisplay key={`${combo.segIndex}-${combo.at}`} combo={combo} stance={stance} />
          ) : seg.kind === 'round' && seg.mode !== 'combos' ? (
            <p key={cue?.text} className="animate-pop font-display text-3xl font-semibold tracking-wide sm:text-4xl" data-testid="cue">
              {cue?.text ?? (block ? block.cue : seg.instruction)}
            </p>
          ) : seg.kind === 'round' ? (
            <p className="text-lg text-white/70">{seg.instruction}</p>
          ) : (
            <div className="animate-fade-up">
              <p className="text-sm font-semibold tracking-wider text-white/45 uppercase">{seg.kind === 'rest' ? 'Up next' : 'Round 1'}</p>
              <p className="mt-1 font-display text-3xl font-bold tracking-wide uppercase sm:text-4xl">{seg.next}</p>
              {seg.nextInstruction && <p className="mt-2 text-white/60">{seg.nextInstruction}</p>}
              {seg.kind === 'rest' && <p className="mt-3 text-sm text-white/45">Breathe deep. Shake out your arms. Sip water.</p>}
            </div>
          )}
          {seg.kind === 'round' && cue && combo && cue.at > combo.at && (
            <p className="mt-3 text-sm font-semibold text-flame-400">{cue.text}</p>
          )}
        </div>

        {!audioOn && <p className="mt-2 text-xs text-amber-300/80">Voice muted — follow the on-screen callouts.</p>}
      </main>

      {/* Controls */}
      <footer className="pb-safe relative px-4 pt-2 sm:px-6">
        <div className="mx-auto flex max-w-md items-center justify-between gap-4 pb-4">
          <button type="button" onClick={() => setConfirm('restart')} className="btn btn-secondary h-16 w-16 rounded-full p-0" aria-label="Restart workout" data-testid="restart">
            <RotateCcw className="h-7 w-7" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={togglePause}
            className="btn btn-primary h-24 w-24 rounded-full p-0 shadow-2xl shadow-brand-600/40"
            aria-label={status === 'running' ? 'Pause' : 'Resume'}
            data-testid="pause-resume"
          >
            {status === 'running' ? <Pause className="h-11 w-11 fill-current" aria-hidden="true" /> : <Play className="ml-1 h-11 w-11 fill-current" aria-hidden="true" />}
          </button>
          {seg.kind !== 'round' && nextSeg ? (
            <button type="button" onClick={runner.skip} className="btn btn-secondary h-16 w-16 flex-col gap-0 rounded-full p-0 text-[10px]" aria-label={seg.kind === 'rest' ? 'Skip rest' : 'Skip countdown'} data-testid="skip">
              <SkipForward className="h-6 w-6" aria-hidden="true" />
              Skip
            </button>
          ) : (
            <button type="button" onClick={() => setConfirm('finish')} className="btn btn-secondary h-16 w-16 flex-col gap-0 rounded-full p-0 text-[10px]" aria-label="Finish workout" data-testid="finish">
              <Flag className="h-6 w-6" aria-hidden="true" />
              Finish
            </button>
          )}
        </div>
        <SessionBar session={session} engine={engine} overall={overall} />
      </footer>

      {confirm && (
        <ConfirmDialog
          title={confirm === 'finish' ? 'End workout now?' : confirm === 'restart' ? 'Restart from the beginning?' : 'Leave this workout?'}
          body={
            confirm === 'finish'
              ? 'Your time and completed rounds are saved as an ended-early session.'
              : confirm === 'restart'
                ? 'The timer goes back to the start with the same combinations.'
                : 'Your progress so far is saved as a started (not finished) session.'
          }
          confirmLabel={confirm === 'finish' ? 'End workout' : confirm === 'restart' ? 'Restart' : 'Leave'}
          onCancel={() => setConfirm(null)}
          onConfirm={confirm === 'finish' ? doFinish : confirm === 'restart' ? doRestart : doExit}
        />
      )}
    </div>
  );
}

function ComboDisplay({ combo, stance }) {
  return (
    <div className="animate-pop" data-testid="combo">
      <ul className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
        {combo.ids.map((id, i) => {
          const tech = TECHNIQUES[id];
          return (
            <li key={`${id}-${i}`} className={`flex items-center gap-2 rounded-2xl border px-3.5 py-2.5 sm:px-5 sm:py-3.5 ${CHIP_COLORS[tech.type]}`}>
              {tech.number && <span className="font-display text-lg font-bold text-white/60 sm:text-xl">{tech.number.replace('b', '')}</span>}
              <span className="font-display text-xl font-semibold tracking-wide uppercase sm:text-3xl">{techniqueLabel(id, stance)}</span>
            </li>
          );
        })}
      </ul>
      <p className="sr-only">{combo.text}</p>
      <p className="mt-3 text-xs text-white/40">
        {[...new Set(combo.ids.map((id) => TECHNIQUE_TYPES[TECHNIQUES[id].type].label))].join(' · ')}
      </p>
    </div>
  );
}

function ProgressRing({ progress, className }) {
  const r = 46;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 100 100" className="h-[min(78vw,22rem,36dvh)] w-[min(78vw,22rem,36dvh)] -rotate-90" aria-hidden="true">
      <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="3" />
      <circle
        cx="50"
        cy="50"
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - progress)}
        className={`${className} transition-[stroke-dashoffset] duration-100 ease-linear`}
      />
    </svg>
  );
}

function SessionBar({ session, engine, overall }) {
  return (
    <div className="mx-auto max-w-3xl pb-3">
      <div className="flex h-2 gap-0.5 overflow-hidden rounded-full" role="progressbar" aria-label="Workout progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(overall * 100)}>
        {session.segments.map((s, i) => {
          const done = i < engine.segIndex ? 1 : i === engine.segIndex ? Math.min(1, engine.elapsed / s.duration) : 0;
          return (
            <div key={i} className="relative h-full bg-white/10" style={{ flexGrow: s.duration }}>
              <div className={`absolute inset-y-0 left-0 ${PHASE_STYLE[s.kind].bar}`} style={{ width: `${done * 100}%` }} />
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-center text-[11px] text-white/40">
        {Math.round(overall * 100)}% complete · Voice: {HAS_PRERECORDED_AUDIO ? 'recorded clips + synthesized' : 'synthesized (browser text-to-speech)'}
      </p>
    </div>
  );
}

function ConfirmDialog({ title, body, confirmLabel, onCancel, onConfirm }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onCancel();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <div className="card w-full max-w-sm animate-pop bg-ink-850 p-6">
        <h2 id="confirm-title" className="text-xl font-bold">{title}</h2>
        <p className="mt-2 text-sm text-white/65">{body}</p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button type="button" className="btn btn-secondary py-3.5" onClick={onCancel} autoFocus>Keep training</button>
          <button type="button" className="btn btn-primary py-3.5" onClick={onConfirm} data-testid="confirm">{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

function ReadyScreen({ workout, session, stance, audioOn, setAudioOn, onStart, onBack }) {
  const speech = typeof window !== 'undefined' && 'speechSynthesis' in window;
  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-ink-950" data-testid="ready">
      <div className="pointer-events-none absolute -top-32 left-1/2 h-96 w-[40rem] -translate-x-1/2 rounded-full bg-brand-600/30 blur-3xl" />
      <header className="relative flex items-center justify-between px-4 pt-[max(env(safe-area-inset-top),0.75rem)] sm:px-6">
        <button type="button" onClick={onBack} className="btn btn-secondary h-12 w-12 p-0" aria-label="Back">
          <X className="h-6 w-6" aria-hidden="true" />
        </button>
        <button type="button" onClick={() => setAudioOn((v) => !v)} className="btn btn-secondary h-12 px-4 text-sm" aria-pressed={!audioOn}>
          {audioOn ? <Volume2 className="h-5 w-5" aria-hidden="true" /> : <VolumeX className="h-5 w-5 text-amber-300" aria-hidden="true" />}
          {audioOn ? 'Voice on' : 'Voice off'}
        </button>
      </header>
      <div className="relative mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center px-6 py-10 text-center">
        <LevelBadge level={workout.level} />
        <h1 className="mt-4 font-display text-4xl font-bold tracking-wide uppercase sm:text-5xl">{workout.title}</h1>
        <div className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-white/65">
          <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" aria-hidden="true" /> {Math.round(session.totalSeconds / 60)} min</span>
          <span className="flex items-center gap-1.5"><Repeat className="h-4 w-4" aria-hidden="true" /> {session.totalRounds} rounds</span>
          <span>{stance === 'southpaw' ? 'Southpaw' : 'Orthodox'}</span>
        </div>
        <button
          type="button"
          onClick={onStart}
          className="btn btn-primary animate-pulse-ring mt-10 h-40 w-40 flex-col rounded-full text-xl"
          data-testid="begin"
        >
          <Play className="h-12 w-12 fill-current" aria-hidden="true" />
          Start
        </button>
        <p className="mt-8 flex max-w-sm items-start gap-2 text-left text-xs leading-relaxed text-white/50">
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            {speech
              ? 'Turn your volume up. Combinations are called by your browser\'s synthesized voice and shown on screen. Keep this screen open while you train.'
              : 'Spoken instructions aren\'t supported in this browser — combinations will be shown on screen.'}
          </span>
        </p>
      </div>
    </div>
  );
}

function SummaryScreen({ workout, outcome, seconds, rounds, totalRounds, combos, onAgain }) {
  const completed = outcome === 'completed';
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-ink-950" data-testid="summary">
      <div className="pointer-events-none absolute -top-32 left-1/2 h-96 w-[40rem] -translate-x-1/2 rounded-full bg-brand-600/30 blur-3xl" />
      <div className="relative mx-auto flex min-h-full max-w-xl flex-col items-center justify-center px-6 py-12 text-center">
        <span className={`flex h-24 w-24 animate-pop items-center justify-center rounded-full ${completed ? 'bg-gradient-to-br from-brand-500 to-flame-500' : 'bg-white/10'}`}>
          {completed ? <Trophy className="h-12 w-12" aria-hidden="true" /> : <Flag className="h-11 w-11" aria-hidden="true" />}
        </span>
        <h1 className="mt-6 font-display text-4xl font-bold tracking-wide uppercase sm:text-5xl" data-testid="summary-title">
          {completed ? 'Workout complete!' : 'Session ended'}
        </h1>
        <p className="mt-2 text-white/65">{workout.title}{completed ? ' — outstanding work.' : ' — saved as ended early.'}</p>

        <dl className="mt-8 grid w-full grid-cols-3 gap-3">
          {[
            { label: 'Time', value: fmtClock(seconds) },
            { label: 'Rounds', value: `${rounds}/${totalRounds}` },
            { label: 'Combos', value: combos },
          ].map((s) => (
            <div key={s.label} className="card p-4">
              <dt className="text-xs font-semibold tracking-wider text-white/45 uppercase">{s.label}</dt>
              <dd className="mt-1 font-display text-2xl font-bold">{s.value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-8 grid w-full gap-3 sm:grid-cols-2">
          <button type="button" onClick={onAgain} className="btn btn-primary py-4"><RotateCcw className="h-5 w-5" aria-hidden="true" /> Train again</button>
          <Link to="/progress" className="btn btn-secondary py-4">View progress <ArrowRight className="h-5 w-5" aria-hidden="true" /></Link>
          <Link to="/workouts" className="btn btn-secondary py-4">More workouts</Link>
          <Link to="/quick" className="btn btn-secondary py-4"><Zap className="h-5 w-5" aria-hidden="true" /> Quick Training</Link>
        </div>

        <div className="card mt-8 w-full p-5 text-left">
          <p className="font-semibold">Want live feedback next time?</p>
          <p className="mt-1 text-sm text-white/60">Call Thai Coach and train with the real-time AI coach over the phone.</p>
          <a href={COACH.telHref} className="btn btn-primary mt-4 w-full"><Phone className="h-5 w-5" aria-hidden="true" /> Call {COACH.phoneDisplay}</a>
        </div>
      </div>
    </div>
  );
}
